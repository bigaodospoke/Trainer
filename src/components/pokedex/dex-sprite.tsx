'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DexSpriteProps {
  name: string;
  normalUrl: string;
  shinyUrl: string;
  size?: number;
}

export function DexSprite({ name, normalUrl, shinyUrl, size = 96 }: DexSpriteProps) {
  const [shiny, setShiny] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5"
        style={{ width: size + 24, height: size + 24 }}
      >
        <Image src={shiny ? shinyUrl : normalUrl} alt={name} width={size} height={size} unoptimized />
      </div>
      <button
        type="button"
        onClick={() => setShiny((s) => !s)}
        className={cn(
          'flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs transition-colors',
          shiny
            ? 'border-purple-neon/50 bg-purple-core/20 text-purple-ice'
            : 'border-white/10 text-ink-muted hover:text-ink-primary'
        )}
      >
        <Sparkles className="h-3 w-3" />
        Shiny
      </button>
    </div>
  );
}
