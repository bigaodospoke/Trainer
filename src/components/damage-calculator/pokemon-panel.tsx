'use client';

import { useEffect, useMemo } from 'react';
import { Combobox } from '@/components/team-builder/combobox';
import { PokemonIcon, ItemIcon } from '@/components/team-builder/sprite-icon';
import { TypeBadgeRow } from '@/components/ui/type-badge';
import {
  SPECIES_OPTIONS,
  ITEM_OPTIONS,
  NATURES,
  TERA_TYPES,
  getSpeciesAbilities,
  getSpeciesTypes,
} from '@/lib/damage-calculator/dex-data';

export interface StatSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonConfig {
  species: string;
  level: number;
  ability: string;
  item: string;
  nature: string;
  teraType: string;
  evs: StatSpread;
  ivs: StatSpread;
}

export const DEFAULT_EVS: StatSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
export const DEFAULT_IVS: StatSpread = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

export const EMPTY_CONFIG: PokemonConfig = {
  species: '',
  level: 100,
  ability: '',
  item: '',
  nature: 'Hardy',
  teraType: '',
  evs: DEFAULT_EVS,
  ivs: DEFAULT_IVS,
};

const STAT_LABELS: { key: keyof StatSpread; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
];

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
    />
  );
}

interface PokemonConfigPanelProps {
  label: string;
  value: PokemonConfig;
  onChange: (next: PokemonConfig) => void;
}

export function PokemonConfigPanel({ label, value, onChange }: PokemonConfigPanelProps) {
  const abilities = useMemo(() => getSpeciesAbilities(value.species), [value.species]);
  const types = useMemo(() => getSpeciesTypes(value.species), [value.species]);

  // Se a especie mudar e a ability atual nao existir mais nessa especie, limpa.
  useEffect(() => {
    if (value.ability && !abilities.some((a) => a.name === value.ability)) {
      onChange({ ...value, ability: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.species]);

  const evTotal = Object.values(value.evs).reduce((s, v) => s + v, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-primary">{label}</h3>
        {types.length > 0 && <TypeBadgeRow types={types} />}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Espécie</label>
        <Combobox
          name={`${label}-species`}
          options={SPECIES_OPTIONS}
          defaultValue={value.species}
          placeholder="ex.: Landorus-Therian"
          
          onValueChange={(species) => onChange({ ...value, species })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Level</label>
          <input
            type="number"
            min={1}
            max={100}
            value={value.level}
            onChange={(e) => onChange({ ...value, level: Number(e.target.value) || 1 })}
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Nature</label>
          <Select value={value.nature} onChange={(e) => onChange({ ...value, nature: e.target.value })}>
            {NATURES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Ability</label>
          <Select value={value.ability} onChange={(e) => onChange({ ...value, ability: e.target.value })}>
            <option value="">—</option>
            {abilities.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name}
                {a.isHidden ? ' (Hidden)' : ''}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Tera Type</label>
          <Select value={value.teraType} onChange={(e) => onChange({ ...value, teraType: e.target.value })}>
            <option value="">Não terastalizado</option>
            {TERA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Item</label>
        <Combobox
          name={`${label}-item`}
          options={ITEM_OPTIONS}
          defaultValue={value.item}
          placeholder="ex.: Choice Scarf"
          allowEmpty
          iconKind="item"
          previewSize={36}
          onValueChange={(item) => onChange({ ...value, item })}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wide text-ink-dim">EVs</label>
          <span className={`font-mono text-xs ${evTotal > 508 ? 'text-danger' : 'text-ink-muted'}`}>
            {evTotal} / 508
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAT_LABELS.map(({ key, label: statLabel }) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] text-ink-dim">{statLabel}</label>
              <input
                type="number"
                min={0}
                max={252}
                step={4}
                value={value.evs[key]}
                onChange={(e) => onChange({ ...value, evs: { ...value.evs, [key]: Number(e.target.value) || 0 } })}
                className="h-9 w-full rounded-lg border border-white/10 bg-void-surface/80 px-2 text-center text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
              />
            </div>
          ))}
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink-primary">IVs (avançado)</summary>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAT_LABELS.map(({ key, label: statLabel }) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] text-ink-dim">{statLabel}</label>
              <input
                type="number"
                min={0}
                max={31}
                value={value.ivs[key]}
                onChange={(e) => onChange({ ...value, ivs: { ...value.ivs, [key]: Number(e.target.value) || 0 } })}
                className="h-9 w-full rounded-lg border border-white/10 bg-void-surface/80 px-2 text-center text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
              />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
