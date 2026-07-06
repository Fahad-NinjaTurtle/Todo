import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleConnection, clearGoogleConnection } from '@/lib/users';
import { revokeToken } from '@/lib/google-calendar';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conn = await getGoogleConnection(session.user.id);
  if (conn) {
    await revokeToken(conn.refreshToken);
    await clearGoogleConnection(session.user.id);
  }

  return NextResponse.json({ ok: true });
}
