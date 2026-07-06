import { createHash } from 'node:crypto';
import { addDays, format, parseISO } from 'date-fns';
import { AppState, Task, Reminder } from '@/types';
import {
  getGoogleConnection, updateGoogleEventMap, GoogleEventRef,
} from './users';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CAL_API = 'https://www.googleapis.com/calendar/v3';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function googleEnv(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function googleRedirectUri(origin: string): string {
  const base = process.env.AUTH_URL?.replace(/\/$/, '') || origin;
  return `${base}/api/google/callback`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
} | null> {
  const env = googleEnv();
  if (!env) return null;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    console.error('Google token exchange failed:', await res.text());
    return null;
  }
  const data = await res.json() as { access_token: string; refresh_token?: string };
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null };
}

export async function getAccessToken(refreshToken: string): Promise<string | null> {
  const env = googleEnv();
  if (!env) return null;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    console.error('Google token refresh failed:', await res.text());
    return null;
  }
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json() as { email?: string };
  return data.email ?? null;
}

export async function revokeToken(refreshToken: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
    method: 'POST',
  }).catch(() => {});
}

async function calFetch(
  accessToken: string,
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<Response> {
  return fetch(`${CAL_API}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

/** Finds an existing "Life OS" calendar or creates a dedicated one. */
export async function ensureLifeOsCalendar(accessToken: string, timeZone: string): Promise<string | null> {
  const list = await calFetch(accessToken, '/users/me/calendarList');
  if (list.ok) {
    const data = await list.json() as { items?: { id: string; summary?: string }[] };
    const existing = data.items?.find(c => c.summary === 'Life OS');
    if (existing) return existing.id;
  }
  const res = await calFetch(accessToken, '/calendars', {
    method: 'POST',
    body: { summary: 'Life OS', timeZone: timeZone || 'UTC' },
  });
  if (!res.ok) {
    console.error('Failed to create Life OS calendar:', await res.text());
    return null;
  }
  const created = await res.json() as { id: string };
  return created.id;
}

interface GEventTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

interface GEvent {
  summary: string;
  description?: string;
  start: GEventTime;
  end: GEventTime;
  reminders: { useDefault: boolean; overrides?: { method: 'popup'; minutes: number }[] };
}

function taskToEvent(task: Task, timeZone: string): GEvent {
  const tz = timeZone || 'UTC';
  const dueDate = task.dueDate!;
  if (task.dueTime) {
    const [h, m] = task.dueTime.split(':').map(Number);
    const endTotal = h * 60 + m + 60;
    const endDate = endTotal >= 1440 ? format(addDays(parseISO(dueDate), 1), 'yyyy-MM-dd') : dueDate;
    const endHm = `${String(Math.floor((endTotal % 1440) / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
    return {
      summary: task.title,
      description: task.description || undefined,
      start: { dateTime: `${dueDate}T${task.dueTime}:00`, timeZone: tz },
      end: { dateTime: `${endDate}T${endHm}:00`, timeZone: tz },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] },
    };
  }
  return {
    summary: task.title,
    description: task.description || undefined,
    start: { date: dueDate },
    end: { date: format(addDays(parseISO(dueDate), 1), 'yyyy-MM-dd') },
    reminders: { useDefault: true },
  };
}

function reminderToEvent(reminder: Reminder): GEvent {
  const start = parseISO(reminder.remindAt);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    summary: `🔔 ${reminder.title}`,
    description: reminder.description || undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] },
  };
}

function eventHash(event: GEvent): string {
  return createHash('sha1').update(JSON.stringify(event)).digest('hex');
}

function buildDesiredEvents(state: AppState): Map<string, GEvent> {
  const timeZone = state.settings.timeZone || 'UTC';
  const desired = new Map<string, GEvent>();

  state.tasks
    .filter(t => t.status !== 'completed' && t.status !== 'archived' && t.dueDate)
    .forEach(t => desired.set(`task-${t.id}`, taskToEvent(t, timeZone)));

  state.reminders
    .filter(r => r.status === 'pending')
    .forEach(r => desired.set(`reminder-${r.id}`, reminderToEvent(r)));

  return desired;
}

/**
 * Pushes tasks (with due dates) and pending reminders to the user's Google
 * Calendar. Diffs against the stored event map so unchanged items cost no
 * API calls. Safe to call after every save.
 */
export async function syncGoogleCalendar(userId: string, state: AppState): Promise<void> {
  try {
    const conn = await getGoogleConnection(userId);
    if (!conn) return;

    const accessToken = await getAccessToken(conn.refreshToken);
    if (!accessToken) return;

    const desired = buildDesiredEvents(state);
    const calPath = `/calendars/${encodeURIComponent(conn.calendarId)}/events`;
    const map: Record<string, GoogleEventRef> = { ...conn.eventMap };
    let changed = false;

    // Remove events for completed/deleted/dismissed items.
    for (const key of Object.keys(map)) {
      if (desired.has(key)) continue;
      await calFetch(accessToken, `${calPath}/${map[key].eventId}`, { method: 'DELETE' });
      delete map[key];
      changed = true;
    }

    // Create or update the rest.
    for (const [key, event] of desired) {
      const hash = eventHash(event);
      const existing = map[key];
      if (existing?.hash === hash) continue;

      if (existing) {
        const res = await calFetch(accessToken, `${calPath}/${existing.eventId}`, { method: 'PUT', body: event });
        if (res.ok) {
          map[key] = { eventId: existing.eventId, hash };
          changed = true;
          continue;
        }
        // Event was deleted manually in Google Calendar — recreate it.
        delete map[key];
      }

      const res = await calFetch(accessToken, calPath, { method: 'POST', body: event });
      if (res.ok) {
        const created = await res.json() as { id: string };
        map[key] = { eventId: created.id, hash };
        changed = true;
      } else {
        console.error(`Google Calendar create failed for ${key}:`, await res.text());
      }
    }

    if (changed) await updateGoogleEventMap(userId, map);
  } catch (err) {
    console.error('Google Calendar sync error:', err);
  }
}
