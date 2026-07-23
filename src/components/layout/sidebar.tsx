'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, ADMIN_NAV_ITEM, PARTNER_PANEL_NAV_ITEM } from './nav-items';
import { useUiSound } from '@/lib/audio/use-ui-sound';

interface SidebarProps {
  username: string;
  isAdmin?: boolean;
  isPartner?: boolean;
}

export function Sidebar({ username, isAdmin, isPartner }: SidebarProps) {
  const pathname = usePathname();
  const { play } = useUiSound();
  const onNav = () => play('nav');

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
              onClick={onNav}
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
        {SECONDARY_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {item.label}
          </Link>
        ))}
        {isPartner && (
          <Link
            href={PARTNER_PANEL_NAV_ITEM.href}
            onClick={onNav}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
          >
            <PARTNER_PANEL_NAV_ITEM.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {PARTNER_PANEL_NAV_ITEM.label}
          </Link>
        )}
        {isAdmin && (
          <Link
            href={ADMIN_NAV_ITEM.href}
            onClick={onNav}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
          >
            <ADMIN_NAV_ITEM.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {ADMIN_NAV_ITEM.label}
          </Link>
        )}
        <Link
          href={`/profile/${username}`}
          onClick={onNav}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          @{username}
        </Link>
      </div>
    </aside>
  );
}
