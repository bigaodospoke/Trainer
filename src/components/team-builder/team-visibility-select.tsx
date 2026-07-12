'use client';

import { useTransition } from 'react';
import { Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

const OPTIONS: { value: Visibility; label: string; icon: typeof Globe }[] = [
  { value: 'PUBLIC', label: 'Público', icon: Globe },
  { value: 'FRIENDS', label: 'Amigos', icon: Users },
  { value: 'PRIVATE', label: 'Privado', icon: Lock },
];

/** Seletor de 3 niveis de compartilhamento do time — Publico (qualquer um ve
 *  na Biblioteca), Amigos (so quem e amigo do dono consegue abrir o link) e
 *  Privado (so o dono). Chama a server action diretamente ao trocar. */
export function TeamVisibilitySelect({
  teamId,
  visibility,
  action,
}: {
  teamId: string;
  visibility: string;
  action: (teamId: string, visibility: Visibility) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-void-surface/80 p-1">
      {OPTIONS.map((opt) => {
        const isActive = visibility === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => action(teamId, opt.value))}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
              isActive ? 'bg-purple-core/20 text-ink-primary' : 'text-ink-muted hover:text-ink-primary'
            )}
          >
            <opt.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
