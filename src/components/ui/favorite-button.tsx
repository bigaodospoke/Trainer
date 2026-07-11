'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleFavorite, type FavoriteTargetType } from '@/lib/favorites/actions';

interface FavoriteButtonProps {
  targetType: FavoriteTargetType;
  targetId: string;
  initialFavorited: boolean;
  revalidate?: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ targetType, targetId, initialFavorited, revalidate, size = 'md' }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const dims = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconDims = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setFavorited((f) => !f);
        startTransition(async () => {
          try {
            await toggleFavorite(targetType, targetId, revalidate);
          } catch {
            setFavorited((f) => !f);
          }
        });
      }}
      title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border transition-colors',
        dims,
        favorited
          ? 'border-purple-neon/50 bg-purple-core/15 text-purple-neon'
          : 'border-white/10 text-ink-dim hover:text-ink-primary'
      )}
    >
      <Heart className={iconDims} strokeWidth={1.75} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
