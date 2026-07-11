'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Volume2 } from 'lucide-react';
import { TypeBadgeRow } from '@/components/ui/type-badge';
import { useCry } from '@/lib/audio/use-cry';

interface SpeciesPreviewProps {
  name: string;
  types: string[];
  normalSpriteUrl: string;
  shinySpriteUrl: string;
  defaultShiny: boolean;
  nationalDex?: number;
}

/**
 * Mostra o sprite animado da especie e alterna para a versao shiny
 * instantaneamente quando o checkbox e marcado — antes, o checkbox "shiny"
 * e a imagem estavam em componentes/escopos diferentes, então marcar o
 * checkbox não atualizava o sprite exibido. Aqui os dois vivem juntos.
 * Tambem toca o cry oficial ao clicar no sprite.
 */
export function SpeciesPreview({
  name,
  types,
  normalSpriteUrl,
  shinySpriteUrl,
  defaultShiny,
  nationalDex,
}: SpeciesPreviewProps) {
  const [shiny, setShiny] = useState(defaultShiny);
  const { playCry } = useCry();

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => playCry(nationalDex)}
        title="Tocar cry"
        className="group relative flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-purple-neon/40"
      >
        <Image src={shiny ? shinySpriteUrl : normalSpriteUrl} alt={name} width={56} height={56} unoptimized />
        {nationalDex && (
          <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-void/70 text-ink-dim opacity-0 transition-opacity group-hover:opacity-100">
            <Volume2 className="h-2.5 w-2.5" strokeWidth={2} />
          </span>
        )}
      </button>
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-primary">{name}</h1>
        <TypeBadgeRow types={types} />
      </div>
      <label className="ml-auto flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          name="shiny"
          value="true"
          checked={shiny}
          onChange={(e) => setShiny(e.target.checked)}
          className="h-4 w-4 accent-purple-core"
        />
        Shiny
      </label>
    </div>
  );
}
