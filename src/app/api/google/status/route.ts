import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleConnection } from '@/lib/users';
import { googleEnv } from '@/lib/google-calendar';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conn = await getGoogleConnection(session.user.id);
  return NextResponse.json({
    configured: !!googleEnv(),
    connected: !!conn,
    email: conn?.email ?? null,
  });
}
