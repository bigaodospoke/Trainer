import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

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
    <div className="flex min-h-screen">
      <Sidebar
        username={session.user.username}
        isAdmin={session.user.role === 'ADMIN'}
      />

      <div className="flex flex-1 flex-col">
        <Topbar
          name={session.user.name ?? session.user.username}
          avatarUrl={session.user.avatarUrl}
        />

        <main className="flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}