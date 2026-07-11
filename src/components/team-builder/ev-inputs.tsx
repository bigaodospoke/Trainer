'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EvInputsProps {
  defaults: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
}

const STAT_LABELS: { key: keyof EvInputsProps['defaults']; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
];

/** EVs com slider + barra de preenchimento (visual estilo Showdown moderno)
 *  em vez de so um campo numerico — mostra de relance onde os 508 pontos
 *  foram investidos. */
export function EvInputs({ defaults }: EvInputsProps) {
  const [values, setValues] = useState(defaults);
  const total = Object.values(values).reduce((sum, v) => sum + v, 0);
  const overBudget = total > 508;

  function setStat(key: keyof EvInputsProps['defaults'], raw: number) {
    const clamped = Math.max(0, Math.min(252, Math.round(raw / 4) * 4));
    setValues((v) => ({ ...v, [key]: clamped }));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-dim">EVs</label>
        <span className={cn('font-mono text-xs', overBudget ? 'text-danger' : 'text-ink-muted')}>
          {total} / 508
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-pill bg-white/5">
        <div
          className={cn('h-full rounded-pill transition-all', overBudget ? 'bg-danger' : 'bg-purple-core')}
          style={{ width: `${Math.min(100, (total / 508) * 100)}%` }}
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
              max={252}
              step={4}
              value={values[key]}
              onChange={(e) => setStat(key, Number(e.target.value))}
              className="h-1.5 flex-1 accent-purple-neon"
              aria-label={`${label} EV slider`}
            />
            <input
              id={`ev${key}`}
              name={`ev${key.charAt(0).toUpperCase()}${key.slice(1)}`}
              type="number"
              min={0}
              max={252}
              step={4}
              value={values[key]}
              onChange={(e) => setStat(key, Number(e.target.value) || 0)}
              className="h-8 w-14 shrink-0 rounded-lg border border-white/10 bg-void-surface/80 px-1.5 text-center text-xs text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
