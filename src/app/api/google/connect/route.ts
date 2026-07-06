import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { googleEnv, googleRedirectUri, GOOGLE_SCOPES } from '@/lib/google-calendar';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const env = googleEnv();
  if (!env) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set in env' },
      { status: 500 }
    );
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.clientId);
  url.searchParams.set('redirect_uri', googleRedirectUri(new URL(request.url).origin));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPES);
  // offline + consent guarantees a refresh token is issued.
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(url);
}
