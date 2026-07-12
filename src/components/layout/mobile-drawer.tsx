'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, ADMIN_NAV_ITEM, PARTNER_PANEL_NAV_ITEM } from './nav-items';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  username: string;
  isAdmin?: boolean;
  isPartner?: boolean;
}

/** Menu de navegacao em drawer para telas < lg — substitui a Sidebar, que
 *  fica oculta abaixo desse breakpoint. Fecha ao navegar, ao clicar no
 *  overlay ou pressionar Escape. */
export function MobileDrawer({ open, onClose, username, isAdmin, isPartner }: MobileDrawerProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="relative flex h-full w-[82vw] max-w-xs flex-col border-r border-white/5 bg-void-surface px-3 py-5"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacao"
          >
            <div className="mb-6 flex items-center justify-between px-2">
              <img src="/logo.png" width="160" height="40" alt="Trainerly Logo" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-white/5 hover:text-ink-primary"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-gradient-to-r from-purple-deep/25 to-purple-core/10 text-ink-primary ring-1 ring-purple-neon/30'
                        : 'text-ink-muted hover:text-ink-primary'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    <span className="flex-1">{item.label}</span>
                    {item.comingSoon && (
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-neon/70" title="Em breve" />
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
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
                >
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  {item.label}
                </Link>
              ))}
              {isPartner && (
                <Link
                  href={PARTNER_PANEL_NAV_ITEM.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
                >
                  <PARTNER_PANEL_NAV_ITEM.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  {PARTNER_PANEL_NAV_ITEM.label}
                </Link>
              )}
              {isAdmin && (
                <Link
                  href={ADMIN_NAV_ITEM.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
                >
                  <ADMIN_NAV_ITEM.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  {ADMIN_NAV_ITEM.label}
                </Link>
              )}
              <Link
                href={`/profile/${username}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink-primary"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                @{username}
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
