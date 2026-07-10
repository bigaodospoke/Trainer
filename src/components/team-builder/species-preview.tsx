'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TypeBadgeRow } from '@/components/ui/type-badge';

interface SpeciesPreviewProps {
  name: string;
  types: string[];
  normalSpriteUrl: string;
  shinySpriteUrl: string;
  defaultShiny: boolean;
}

/**
 * Mostra o sprite animado da especie e alterna para a versao shiny
 * instantaneamente quando o checkbox e marcado — antes, o checkbox "shiny"
 * e a imagem estavam em componentes/escopos diferentes, então marcar o
 * checkbox não atualizava o sprite exibido. Aqui os dois vivem juntos.
 */
export function SpeciesPreview({ name, types, normalSpriteUrl, shinySpriteUrl, defaultShiny }: SpeciesPreviewProps) {
  const [shiny, setShiny] = useState(defaultShiny);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Image src={shiny ? shinySpriteUrl : normalSpriteUrl} alt={name} width={56} height={56} unoptimized />
      </div>
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
