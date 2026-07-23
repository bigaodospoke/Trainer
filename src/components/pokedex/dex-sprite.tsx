'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCry } from '@/lib/audio/use-cry';

interface DexSpriteProps {
  name: string;
  normalUrl: string;
  shinyUrl: string;
  size?: number;
  /** National dex number — usado pra tocar o cry oficial. */
  nationalDex?: number;
}

export function DexSprite({ name, normalUrl, shinyUrl, size = 96, nationalDex }: DexSpriteProps) {
  const [shiny, setShiny] = useState(false);
  const { playCry } = useCry();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => playCry(nationalDex)}
        title="Tocar cry"
        className="group relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:border-purple-neon/40"
        style={{ width: size + 24, height: size + 24 }}
      >
        <Image
          src={shiny ? shinyUrl : normalUrl}
          alt={name}
          width={size}
          height={size}
          unoptimized
          className="transition-transform duration-300 ease-out group-hover:scale-110"
        />
        {nationalDex && (
          <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-void/70 text-ink-dim opacity-0 transition-opacity group-hover:opacity-100">
            <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
        )}
      </button>
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
