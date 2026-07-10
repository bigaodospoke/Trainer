'use client';

import { Search, Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface TopbarProps {
  name: string;
  avatarUrl: string | null;
}

/** Barra superior fixa com a busca global (Pokemon, times, usuarios, moves, itens). */
export function Topbar({ name, avatarUrl }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/5 bg-void/70 px-6 backdrop-blur-xl">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
        <input
          type="search"
          placeholder="Buscar Pokemon, times, usuarios, moves, itens..."
          className="h-9 w-full rounded-pill border border-white/10 bg-void-surface/80 pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-dim outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
        />
      </div>

      <ThemeToggle />

      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-primary"
        aria-label="Notificacoes"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>

      <div className="flex items-center gap-2">
        <Avatar src={avatarUrl} name={name} size={32} />
        <span className="hidden text-sm text-ink-primary sm:inline">{name}</span>
      </div>
    </header>
  );
}
