import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  exchangeCodeForTokens, fetchGoogleEmail, ensureLifeOsCalendar,
  googleRedirectUri, syncGoogleCalendar,
} from '@/lib/google-calendar';
import { saveGoogleConnection, getUserData } from '@/lib/users';
import { normalizeState } from '@/lib/storage';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/?calendar=error&reason=${encodeURIComponent(reason)}`, request.url));

  if (!code) return fail(requestUrl.searchParams.get('error') ?? 'no_code');

  const tokens = await exchangeCodeForTokens(code, googleRedirectUri(requestUrl.origin));
  if (!tokens) return fail('token_exchange');
  if (!tokens.refreshToken) return fail('no_refresh_token');

  const email = await fetchGoogleEmail(tokens.accessToken);

  const data = await getUserData(session.user.id);
  const state = data ? normalizeState(data) : null;
  const timeZone = state?.settings.timeZone || 'UTC';

  const calendarId = await ensureLifeOsCalendar(tokens.accessToken, timeZone);
  if (!calendarId) return fail('calendar_create');

  await saveGoogleConnection(session.user.id, {
    refreshToken: tokens.refreshToken,
    email: email ?? '',
    calendarId,
  });

  // Push everything immediately so the calendar fills up right away.
  if (state) await syncGoogleCalendar(session.user.id, state);

  return NextResponse.redirect(new URL('/?calendar=connected', request.url));
}
