'use client';

import { useState } from 'react';
import { EvInputs, type EvSpread, EV_TOTAL_CAP, EV_STAT_CAP } from './ev-inputs';
import { IvInputs, type IvSpread } from './iv-inputs';
import { NATURES } from '@/lib/team-builder/constants';
import { formatNatureLabel } from '@/lib/team-builder/natures';
import { calculateAllStats, type BaseStats } from '@/lib/team-builder/stat-calc';

interface StatsEditorProps {
  baseStats: BaseStats;
  defaultLevel: number;
  defaultNature: string;
  defaultEvs: EvSpread;
  defaultIvs: IvSpread;
}

const STAT_ROWS: { key: keyof BaseStats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
];

/** Reune Level, Nature, EVs e IVs num unico componente controlado — precisa
 *  ser um so porque o calculo de stats finais em tempo real depende dos 4 ao
 *  mesmo tempo. Os inputs continuam com `name` normal, entao o form nativo
 *  em volta (Server Component) submete exatamente como antes. */
export function StatsEditor({ baseStats, defaultLevel, defaultNature, defaultEvs, defaultIvs }: StatsEditorProps) {
  const [level, setLevel] = useState(defaultLevel);
  const [nature, setNature] = useState(defaultNature);
  const [evs, setEvs] = useState(defaultEvs);
  const [ivs, setIvs] = useState(defaultIvs);

  function setEvStat(key: keyof EvSpread, raw: number) {
    const clamped = Math.max(0, Math.min(EV_STAT_CAP, Math.round(raw / 4) * 4));
    setEvs((prev) => {
      const otherTotal = (Object.keys(prev) as (keyof EvSpread)[])
        .filter((k) => k !== key)
        .reduce((sum, k) => sum + prev[k], 0);
      const maxAllowed = Math.max(0, Math.min(EV_STAT_CAP, EV_TOTAL_CAP - otherTotal));
      return { ...prev, [key]: Math.min(clamped, maxAllowed) };
    });
  }

  function setIvStat(key: keyof IvSpread, raw: number) {
    setIvs((prev) => ({ ...prev, [key]: Math.max(0, Math.min(31, Math.round(raw))) }));
  }

  const finalStats = calculateAllStats(baseStats, ivs, evs, level, nature);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="level" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Level</label>
          <input
            id="level"
            name="level"
            type="number"
            min={1}
            max={100}
            value={level}
            onChange={(e) => setLevel(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label htmlFor="natureName" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Nature</label>
          <select
            id="natureName"
            name="natureName"
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          >
            {NATURES.map((n) => (
              <option key={n} value={n}>{formatNatureLabel(n)}</option>
            ))}
          </select>
        </div>
      </div>

      <EvInputs values={evs} onChange={setEvStat} />
      <IvInputs values={ivs} onChange={setIvStat} onSetAll={(v) => setIvs({ hp: v, atk: v, def: v, spa: v, spd: v, spe: v })} />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">Stats finais (Lv.{level})</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAT_ROWS.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center">
              <p className="text-[10px] text-ink-dim">{label}</p>
              <p className="font-mono text-lg text-ink-primary">{finalStats[key]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
