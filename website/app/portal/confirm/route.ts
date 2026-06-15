import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailConfirmToken } from '@/lib/client-auth';
import { confirmClientEmail, getSubmissionById } from '@/lib/submissions-store';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const parsed = await verifyEmailConfirmToken(token);

  if (!parsed) {
    return NextResponse.redirect(new URL('/portal/login?error=confirm-invalid', request.url));
  }

  const sub = await getSubmissionById(parsed.submissionId);
  if (!sub || sub.email.toLowerCase() !== parsed.email) {
    return NextResponse.redirect(new URL('/portal/login?error=confirm-invalid', request.url));
  }

  const updated = await confirmClientEmail(parsed.submissionId, parsed.email);
  if (!updated) {
    return NextResponse.redirect(new URL('/portal/login?error=confirm-failed', request.url));
  }

  return NextResponse.redirect(new URL('/portal/login', request.url));
}