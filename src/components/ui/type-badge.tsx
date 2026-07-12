'use client';

import { useState } from 'react';
import { getTypeInfo } from '@/lib/pokemon-types';

interface TypeBadgeProps {
  type: string;
  /** Mantido por compatibilidade com chamadas existentes — o selo oficial
   *  (ver abaixo) ja vem com o nome do tipo desenhado dentro da imagem,
   *  entao "icon" e "full" renderizam a mesma coisa hoje. */
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md';
}

/** Selo oficial do tipo ("FIRE", "GRASS"...), na proporcao nativa 32x14 do
 *  asset do Pokemon Showdown — cada imagem ja e o badge completo (fundo
 *  colorido + nome), entao NAO deve ser colocada dentro de outro pill nem
 *  espremida num quadrado pequeno (era a causa do icone "quebrado"/borrado
 *  visto em telas menores). Se a imagem falhar ao carregar, cai pra um pill
 *  colorido simples com o glifo do tipo, pra nunca mostrar um espaco vazio. */
export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const info = getTypeInfo(type);
  const [iconFailed, setIconFailed] = useState(false);
  const height = size === 'sm' ? 13 : 16;
  const width = size === 'sm' ? 30 : 37;

  if (info.iconUrl && !iconFailed) {
    return (
      <img
        src={info.iconUrl}
        alt={type}
        title={type}
        width={width}
        height={height}
        className="inline-block shrink-0 rounded-[3px] align-middle"
        onError={() => setIconFailed(true)}
      />
    );
  }

  const dims = size === 'sm' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill font-medium text-white ${dims}`}
      style={{ backgroundColor: info.color }}
      title={type}
    >
      <span aria-hidden="true" className="leading-none">{info.glyph}</span>
      <span>{type}</span>
    </span>
  );
}

/** Linha compacta de badges de tipo (1 ou 2 tipos). */
export function TypeBadgeRow({ types, size = 'sm' }: { types: string[]; size?: 'sm' | 'md' }) {
  if (types.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {types.map((t) => (
        <TypeBadge key={t} type={t} variant="icon" size={size} />
      ))}
    </span>
  );
}
