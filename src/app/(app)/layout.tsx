import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { hasPartnerAccess } from '@/lib/partners/constants';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <AppShell
      username={session.user.username}
      isAdmin={session.user.role === 'ADMIN'}
      isPartner={hasPartnerAccess(session.user.tags)}
      name={session.user.name ?? session.user.username}
      avatarUrl={session.user.avatarUrl}
    >
      {children}
    </AppShell>
  );
}