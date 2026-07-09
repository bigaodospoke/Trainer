import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SignInClient from './signin-client';

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return <SignInClient />;
}