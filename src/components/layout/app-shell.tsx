'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileDrawer } from './mobile-drawer';
import { PresenceHeartbeat } from './presence-heartbeat';

interface AppShellProps {
  username: string;
  isAdmin?: boolean;
  name: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}

/** Casca do layout autenticado: Sidebar fixa no desktop (lg+) e um drawer
 *  mobile equivalente abaixo disso, controlados pelo mesmo estado — a
 *  Sidebar em si nao tem substituto quando escondida, entao o drawer existe
 *  para nunca deixar a navegacao inacessivel em telas pequenas. */
export function AppShell({ username, isAdmin, name, avatarUrl, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <PresenceHeartbeat />
      <Sidebar username={username} isAdmin={isAdmin} />
      <MobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        username={username}
        isAdmin={isAdmin}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={name} avatarUrl={avatarUrl} onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
