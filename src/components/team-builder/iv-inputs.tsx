'use client';

export interface IvSpread {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

interface IvInputsProps {
  values: IvSpread;
  onChange: (key: keyof IvSpread, value: number) => void;
  onSetAll: (value: number) => void;
}

const STAT_LABELS: { key: keyof IvSpread; label: string; formKey: string }[] = [
  { key: 'hp', label: 'HP', formKey: 'ivHp' },
  { key: 'atk', label: 'Atk', formKey: 'ivAtk' },
  { key: 'def', label: 'Def', formKey: 'ivDef' },
  { key: 'spa', label: 'SpA', formKey: 'ivSpa' },
  { key: 'spd', label: 'SpD', formKey: 'ivSpd' },
  { key: 'spe', label: 'Spe', formKey: 'ivSpe' },
];

/** IVs com slider (0-31) + atalho "31 em todos" / "0 em todos". Controlado
 *  pelo pai (StatsEditor) — ver EvInputs pro motivo (calculo de stats finais
 *  em tempo real precisa do valor atual num componente irmao). */
export function IvInputs({ values, onChange, onSetAll }: IvInputsProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-dim">IVs</label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onSetAll(31)}
            className="rounded-pill border border-white/10 px-2 py-0.5 text-[10px] text-ink-muted hover:text-ink-primary"
          >
            31 em todos
          </button>
          <button
            type="button"
            onClick={() => onSetAll(0)}
            className="rounded-pill border border-white/10 px-2 py-0.5 text-[10px] text-ink-muted hover:text-ink-primary"
          >
            0 em todos
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {STAT_LABELS.map(({ key, label, formKey }) => (
          <div key={key} className="flex items-center gap-3">
            <label htmlFor={formKey} className="w-9 shrink-0 text-xs font-medium text-ink-muted">
              {label}
            </label>
            <input
              type="range"
              min={0}
              max={31}
              value={values[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="h-1.5 flex-1 accent-purple-ice"
              aria-label={`${label} IV slider`}
            />
            <input
              id={formKey}
              name={formKey}
              type="number"
              min={0}
              max={31}
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
