'use client';

import { cn } from '@/lib/utils';

export interface EvSpread {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

interface EvInputsProps {
  values: EvSpread;
  onChange: (key: keyof EvSpread, value: number) => void;
}

const STAT_LABELS: { key: keyof EvSpread; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
];

/** Limite oficial (cap real do jogo — nao o "508" que algumas ferramentas
 *  usam por convencao de multiplos de 4; o jogo aceita ate 510). */
export const EV_TOTAL_CAP = 510;
export const EV_STAT_CAP = 252;

/** EVs com slider + barra de preenchimento (visual estilo Showdown moderno).
 *  Controlado pelo pai (StatsEditor) — nao guarda estado proprio — pra
 *  alimentar o calculo de stats finais em tempo real e o rodape do
 *  Damage Calculator com o mesmo dado. Bloqueia automaticamente qualquer
 *  stat que faria o total passar de 510. */
export function EvInputs({ values, onChange }: EvInputsProps) {
  const total = Object.values(values).reduce((sum, v) => sum + v, 0);
  const overBudget = total > EV_TOTAL_CAP;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-dim">EVs</label>
        <span className={cn('font-mono text-xs', overBudget ? 'text-danger' : 'text-ink-muted')}>
          EVs usados: {total} / {EV_TOTAL_CAP}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-pill bg-white/5">
        <div
          className={cn('h-full rounded-pill transition-all', overBudget ? 'bg-danger' : 'bg-purple-core')}
          style={{ width: `${Math.min(100, (total / EV_TOTAL_CAP) * 100)}%` }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {STAT_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <label htmlFor={`ev${key}`} className="w-9 shrink-0 text-xs font-medium text-ink-muted">
              {label}
            </label>
            <input
              type="range"
              min={0}
              max={EV_STAT_CAP}
              step={4}
              value={values[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="h-1.5 flex-1 accent-purple-neon"
              aria-label={`${label} EV slider`}
            />
            <input
              id={`ev${key}`}
              name={`ev${key.charAt(0).toUpperCase()}${key.slice(1)}`}
              type="number"
              min={0}
              max={EV_STAT_CAP}
              step={4}
              value={values[key]}
              onChange={(e) => onChange(key, Number(e.target.value) || 0)}
              className="h-8 w-14 shrink-0 rounded-lg border border-white/10 bg-void-surface/80 px-1.5 text-center text-xs text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
