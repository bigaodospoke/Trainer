'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Swords,
  Calculator,
  BookOpen,
  TrendingUp,
  Library,
  Trophy,
  Heart,
  Star,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Fases futuras (Team Builder, Pokedex, etc.) apontam para paginas
   *  "em breve" ate a fase de dados/integracao ser concluida. */
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Team Builder', href: '/team-builder', icon: Swords },
  { label: 'Damage Calculator', href: '/damage-calculator', icon: Calculator },
  { label: 'Pokedex', href: '/pokedex', icon: BookOpen },
  { label: 'Meta Analyzer', href: '/meta-analyzer', icon: TrendingUp },
  { label: 'Biblioteca de Times', href: '/library', icon: Library },
  { label: 'Rankings', href: '/rankings', icon: Trophy },
  { label: 'Apoiadores', href: '/apoiadores', icon: Heart },
];

interface SidebarProps {
  username: string;
  isAdmin?: boolean;
}

export function Sidebar({ username, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-void-surface/60 px-3 py-5 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
      <img src="/logo.png" width="200" height="50" alt="Trainerly Logo" />
        {/* <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 6 L94 50 L50 94 L6 50 Z" fill="url(#brand-gradient)" />
          <defs>
            <linearGradient id="brand-gradient" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#B266FF" />
              <stop offset="100%" stopColor="#5B21B6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-display text-lg font-semibold tracking-tight text-ink-primary">
          Trainerly
        </span> */}
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-facet"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-deep/25 to-purple-core/10 ring-1 ring-purple-neon/30"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <item.icon className="relative z-10 h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="relative z-10 flex-1">{item.label}</span>
              {item.comingSoon && (
                <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-purple-neon/70" title="Em breve" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 flex flex-col gap-1 border-t border-white/5 pt-3">
        <Link
          href="/favoritos"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
        >
          <Star className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Meus Favoritos
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Configuracoes
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
          >
            <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Administracao
          </Link>
        )}
        <Link
          href={`/profile/${username}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          @{username}
        </Link>
      </div>
    </aside>
  );
}
