'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { SearchableSelect, type SearchableSelectOption } from './searchable-select';
import { Combobox, type ComboboxOption } from './combobox';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import type { BuildComponentRow } from '@/lib/meta-analyzer/queries';

export interface CompetitiveSnapshot {
  tier: string | null;
  usagePercent: number | null;
  speedTierLv100: number;
}

export interface SpeciesBuildComponentsData {
  abilities: BuildComponentRow[];
  items: BuildComponentRow[];
  moves: BuildComponentRow[];
  teraTypes: BuildComponentRow[];
}

interface CompetitiveFieldsProps {
  defaultAbilityId: string;
  defaultItemName: string;
  defaultTeraType: string;
  defaultMoves: [string, string, string, string];
  abilityOptions: SearchableSelectOption[];
  itemOptions: ComboboxOption[];
  teraOptions: SearchableSelectOption[];
  moveOptions: ComboboxOption[];
  snapshot: CompetitiveSnapshot | null;
  buildComponents: SpeciesBuildComponentsData | null;
}

/** Ability/Item/Tera/Golpes + o painel "Competitive Snapshot" e "Componentes
 *  mais usados" (dados reais do chaos report da Smogon — ver
 *  getSpeciesBuildComponents). Ficam juntos num so client component porque
 *  "Aplicar" precisa alterar o valor inicial dos campos de baixo — cada
 *  aplicacao troca a `key` do campo, forcando o React a remonta-lo com o
 *  novo `defaultValue` (mais simples e robusto que virar tudo controlado). */
export function CompetitiveFields({
  defaultAbilityId,
  defaultItemName,
  defaultTeraType,
  defaultMoves,
  abilityOptions,
  itemOptions,
  teraOptions,
  moveOptions,
  snapshot,
  buildComponents,
}: CompetitiveFieldsProps) {
  const [applied, setApplied] = useState<{
    abilityId?: string;
    itemName?: string;
    teraType?: string;
    moves?: [string, string, string, string];
    gen: number;
  }>({ gen: 0 });

  function applyAbility(row: BuildComponentRow) {
    const match = abilityOptions.find((o) => o.label.toLowerCase() === row.displayName.toLowerCase());
    if (!match) return;
    setApplied((a) => ({ ...a, abilityId: match.value, gen: a.gen + 1 }));
  }

  function applyItem(row: BuildComponentRow) {
    setApplied((a) => ({ ...a, itemName: row.displayName, gen: a.gen + 1 }));
  }

  function applyTera(row: BuildComponentRow) {
    setApplied((a) => ({ ...a, teraType: row.refSlug.toUpperCase(), gen: a.gen + 1 }));
  }

  function applyTopMoves() {
    const top4 = buildComponents?.moves.slice(0, 4).map((m) => m.displayName) ?? [];
    if (top4.length === 0) return;
    const moves: [string, string, string, string] = [top4[0] ?? '', top4[1] ?? '', top4[2] ?? '', top4[3] ?? ''];
    setApplied((a) => ({ ...a, moves, gen: a.gen + 1 }));
  }

  const abilityValue = applied.abilityId ?? defaultAbilityId;
  const itemValue = applied.itemName ?? defaultItemName;
  const teraValue = applied.teraType ?? defaultTeraType;
  const moveValues = applied.moves ?? defaultMoves;

  const hasSnapshot = snapshot && (snapshot.tier || snapshot.usagePercent !== null);
  const hasComponents = buildComponents && (buildComponents.abilities.length > 0 || buildComponents.items.length > 0 || buildComponents.moves.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {(hasSnapshot || hasComponents) && (
        <GlassCard padding="md" className="border-purple-neon/20">
          {hasSnapshot && (
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-dim">
                <TrendingUp className="h-3.5 w-3.5 text-purple-neon" />
                Competitive Snapshot
              </div>
              {snapshot!.tier && <Badge tone="purple">{snapshot!.tier}</Badge>}
              {snapshot!.usagePercent !== null && (
                <span className="text-xs text-ink-muted">Usage: <span className="font-mono text-ink-primary">{snapshot!.usagePercent.toFixed(1)}%</span></span>
              )}
              <span className="text-xs text-ink-muted">
                Speed Tier (Lv.100, 252 EVs, neutro): <span className="font-mono text-ink-primary">{snapshot!.speedTierLv100}</span>
              </span>
              {snapshot!.usagePercent === null && !snapshot!.tier && (
                <span className="text-xs text-ink-dim">Sem dados de uso sincronizados pra este formato.</span>
              )}
            </div>
          )}

          {hasComponents && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-dim">
                  <Sparkles className="h-3.5 w-3.5 text-purple-neon" />
                  Componentes mais usados (Gen 9 OU)
                </span>
                {buildComponents!.moves.length > 0 && (
                  <button type="button" onClick={applyTopMoves} className="text-[11px] text-purple-neon underline hover:text-purple-ice">
                    Aplicar top 4 golpes
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ComponentGroup label="Ability" rows={buildComponents!.abilities} onApply={applyAbility} />
                <ComponentGroup label="Item" rows={buildComponents!.items} onApply={applyItem} />
                <ComponentGroup label="Tera Type" rows={buildComponents!.teraTypes} onApply={applyTera} />
                <ComponentGroup label="Golpes" rows={buildComponents!.moves} onApply={() => {}} hideApply />
              </div>
              <p className="mt-3 text-[10px] text-ink-dim">
                % de uso de cada componente entre os sets desta espécie no formato — a Smogon não publica EV spread nem win rate por set, só por componente.
              </p>
            </div>
          )}
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Ability</label>
          <SearchableSelect
            key={`ability-${applied.gen}`}
            name="abilityId"
            defaultValue={abilityValue}
            allowEmpty
            placeholder="Escolher ability..."
            options={abilityOptions}
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Item</label>
          <Combobox
            key={`item-${applied.gen}`}
            name="itemName"
            options={itemOptions}
            defaultValue={itemValue}
            placeholder="ex.: Choice Scarf"
            allowEmpty
            iconKind="item"
            previewSize={36}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Tera Type</label>
          <SearchableSelect
            key={`tera-${applied.gen}`}
            name="teraType"
            defaultValue={teraValue}
            allowEmpty
            placeholder="Escolher tera type..."
            options={teraOptions}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-dim">Golpes</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Combobox
              key={`move${i}-${applied.gen}`}
              name={`move${i + 1}`}
              iconKind="move"
              options={moveOptions}
              defaultValue={moveValues[i]}
              placeholder="ex.: Dragon Claw"
              allowEmpty
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ComponentGroup({
  label,
  rows,
  onApply,
  hideApply,
}: {
  label: string;
  rows: BuildComponentRow[];
  onApply: (row: BuildComponentRow) => void;
  hideApply?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-dim">{label}</p>
      <div className="flex flex-col gap-1">
        {rows.slice(0, 4).map((row) => (
          <button
            key={row.refSlug}
            type="button"
            disabled={hideApply}
            onClick={() => onApply(row)}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1 text-left text-xs text-ink-muted transition-colors hover:border-purple-neon/30 hover:text-ink-primary disabled:cursor-default disabled:hover:border-white/5 disabled:hover:text-ink-muted"
          >
            <span className="truncate">{row.displayName}</span>
            <span className="shrink-0 font-mono text-[10px] text-ink-dim">{row.usagePercent.toFixed(1)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
