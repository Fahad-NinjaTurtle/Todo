import { NextResponse, after } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserState, saveUserData } from '@/lib/users';
import { createEmptyState, normalizeState } from '@/lib/storage';
import { syncGoogleCalendar } from '@/lib/google-calendar';
import { AppState } from '@/types';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await getUserState(session.user.id);

    if (!existing) {
      const empty = createEmptyState();
      if (session.user.name) empty.settings.userName = session.user.name;
      const updatedAt = await saveUserData(session.user.id, empty);
      return NextResponse.json({ state: empty, updatedAt: updatedAt.toISOString() });
    }

    return NextResponse.json({
      state: normalizeState(existing.data),
      updatedAt: existing.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error('Sync GET error:', err);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

interface SyncPutBody {
  state: Partial<AppState>;
  /** Server updatedAt the client last synced against, for conflict detection. */
  baseUpdatedAt?: string | null;
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as SyncPutBody;
    const normalized = normalizeState(body.state);

    // Reject stale writes: if another device saved after this client's last
    // sync, return the server copy so the client can merge instead of clobber.
    if (body.baseUpdatedAt) {
      const existing = await getUserState(session.user.id);
      if (existing && existing.updatedAt.toISOString() > body.baseUpdatedAt) {
        return NextResponse.json({
          conflict: true,
          state: normalizeState(existing.data),
          updatedAt: existing.updatedAt.toISOString(),
        }, { status: 409 });
      }
    }

    const updatedAt = await saveUserData(session.user.id, normalized);

    // Push tasks/reminders to Google Calendar after the response is sent.
    const userId = session.user.id;
    after(() => syncGoogleCalendar(userId, normalized));

    return NextResponse.json({ ok: true, updatedAt: updatedAt.toISOString() });
  } catch (err) {
    console.error('Sync PUT error:', err);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
