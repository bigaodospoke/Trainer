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

export function EvInputs({ defaults }: EvInputsProps) {
  const [values, setValues] = useState(defaults);
  const total = Object.values(values).reduce((sum, v) => sum + v, 0);
  const overBudget = total > 508;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-dim">EVs</label>
        <span className={cn('font-mono text-xs', overBudget ? 'text-danger' : 'text-ink-muted')}>
          {total} / 508
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {STAT_LABELS.map(({ key, label }) => (
          <div key={key}>
            <label htmlFor={`ev${key}`} className="mb-1 block text-[10px] text-ink-dim">
              {label}
            </label>
            <input
              id={`ev${key}`}
              name={`ev${key.charAt(0).toUpperCase()}${key.slice(1)}`}
              type="number"
              min={0}
              max={252}
              step={4}
              value={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: Number(e.target.value) || 0 }))}
              className="h-9 w-full rounded-lg border border-white/10 bg-void-surface/80 px-2 text-center text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
