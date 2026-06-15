import { redirect } from 'next/navigation';

/** Password setup now happens inline on /portal/login — keep this route as a safe redirect. */
export default function ChangePasswordRedirect() {
  redirect('/portal/login');
}