'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { NATURE_EFFECTS, STAT_LABELS } from '@/lib/team-builder/natures';

/** Nature com setas coloridas (verde pra cima / vermelho pra baixo) em vez
 *  de texto "+/-" — usado em qualquer lugar que NAO seja um <select> nativo
 *  (que so aceita texto puro em <option>, ver formatNatureLabel pra esses
 *  casos). Tooltip nativo via title, sem dependencia nova. */
export function NatureBadge({ nature, size = 'md' }: { nature: string; size?: 'sm' | 'md' }) {
  const effect = NATURE_EFFECTS[nature];
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (!effect || (!effect.plus && !effect.minus)) {
    return <span className={`${textSize} text-ink-primary`}>{nature} <span className="text-ink-dim">(neutra)</span></span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize} text-ink-primary`}>
      {nature}
      <span className="inline-flex items-center gap-0.5 text-success" title={`Increased Stat: ${STAT_LABELS[effect.plus!]}`}>
        <ArrowUp className={iconSize} strokeWidth={2.5} />
        {STAT_LABELS[effect.plus!]}
      </span>
      <span className="inline-flex items-center gap-0.5 text-danger" title={`Decreased Stat: ${STAT_LABELS[effect.minus!]}`}>
        <ArrowDown className={iconSize} strokeWidth={2.5} />
        {STAT_LABELS[effect.minus!]}
      </span>
    </span>
  );
}
