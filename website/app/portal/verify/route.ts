import { NextRequest, NextResponse } from 'next/server';
import { verifyClientMagicToken, setClientCookie } from '@/lib/client-auth';
import { getSubmissionByEmail } from '@/lib/submissions-store';
import { canClientSignIn } from '@/lib/portal-access';

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
    return NextResponse.redirect(new URL('/portal/login?error=invalid', request.url));
  }

  const sub = await getSubmissionByEmail(email);
  if (!sub || !canClientSignIn(sub)) {
    return NextResponse.redirect(new URL('/portal/login', request.url));
  }

  await setClientCookie(email);

  const dest = sub.mustChangePassword ? '/portal/login' : '/portal';
  return NextResponse.redirect(new URL(dest, request.url));
}
