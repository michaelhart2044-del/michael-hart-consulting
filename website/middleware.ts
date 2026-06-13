import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight route protection for /admin.
 *
 * - Presence of the httpOnly 'mh_admin' cookie is required for anything except /admin/login.
 * - Full cryptographic signature + expiry verification happens inside the server actions
 *   (Node runtime, using the crypto module safely).
 * - This keeps the Edge middleware free of Node-only modules and avoids runtime warnings.
 *
 * Additional layers: robots.txt disallow, noindex metadata in layout, and re-checks in every admin action.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const hasSessionCookie = !!request.cookies.get('mh_admin')?.value;

  if (!hasSessionCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
