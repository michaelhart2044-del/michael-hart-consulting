import { NextRequest, NextResponse } from 'next/server';
import { verifyClientMagicToken, setClientCookie } from '@/lib/client-auth';

/**
 * Route Handler for /portal/verify
 * This is the correct place to mutate cookies on a GET (magic link callback).
 * Previously the cookie set was attempted from a Server Component render,
 * which is not allowed (hence the "Cookies can only be modified in a Server Action or Route Handler" error).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';

  const email = await verifyClientMagicToken(token);

  if (!email) {
    // Invalid/expired token - send back to login with error
    return NextResponse.redirect(new URL('/portal/login?error=invalid', request.url));
  }

  // This is allowed here because we are inside a Route Handler
  await setClientCookie(email);

  // Success - go to the portal (will show guided first-time experience if needed)
  return NextResponse.redirect(new URL('/portal', request.url));
}
