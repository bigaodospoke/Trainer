import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar username="teste" isAdmin={false} />

      <div className="flex flex-1 flex-col">
        <Topbar
          name="Usuário"
          avatarUrl={null}
        />

        <main className="flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}