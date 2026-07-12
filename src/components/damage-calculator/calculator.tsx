'use client';

import { useMemo, useState, useTransition } from 'react';
import { calculate, Pokemon, Move, Field } from '@smogon/calc';
import { Swords, Save } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/team-builder/combobox';
import { gen9, MOVE_OPTIONS, WEATHER_OPTIONS, TERRAIN_OPTIONS } from '@/lib/damage-calculator/dex-data';
import { PokemonConfigPanel, EMPTY_CONFIG, type PokemonConfig } from './pokemon-panel';
import { saveCalculation } from '@/app/(app)/damage-calculator/actions';

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
    />
  );
}

interface FieldConfig {
  weather: string;
  terrain: string;
  isReflect: boolean;
  isLightScreen: boolean;
  isHelpingHand: boolean;
  isCrit: boolean;
}

const EMPTY_FIELD: FieldConfig = {
  weather: 'None',
  terrain: 'None',
  isReflect: false,
  isLightScreen: false,
  isHelpingHand: false,
  isCrit: false,
};

function buildPokemon(config: PokemonConfig) {
  if (!config.species) return null;
  try {
    return new Pokemon(gen9, config.species, {
      level: config.level,
      ability: config.ability || undefined,
      item: config.item || undefined,
      nature: config.nature,
      teraType: (config.teraType || undefined) as never,
      evs: config.evs,
      ivs: config.ivs,
      boosts: config.boosts,
      status: config.status || undefined,
    });
  } catch {
    return null;
  }
}

export function DamageCalculator() {
  const [attacker, setAttacker] = useState<PokemonConfig>(EMPTY_CONFIG);
  const [defender, setDefender] = useState<PokemonConfig>(EMPTY_CONFIG);
  const [moveName, setMoveName] = useState('');
  const [field, setField] = useState<FieldConfig>(EMPTY_FIELD);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  const result = useMemo(() => {
    const atk = buildPokemon(attacker);
    const def = buildPokemon(defender);
    if (!atk || !def || !moveName) return null;

    try {
      const move = new Move(gen9, moveName, { isCrit: field.isCrit });
      const fieldObj = new Field({
        weather: field.weather === 'None' ? undefined : (field.weather as never),
        terrain: field.terrain === 'None' ? undefined : (field.terrain as never),
        defenderSide: { isReflect: field.isReflect, isLightScreen: field.isLightScreen },
        attackerSide: { isHelpingHand: field.isHelpingHand },
      });
      return calculate(gen9, atk, def, move, fieldObj);
    } catch (err) {
      return { error: String(err instanceof Error ? err.message : err) };
    }
  }, [attacker, defender, moveName, field]);

  const hasError = result && 'error' in result;
  const validResult = result && !('error' in result) ? result : null;

  const damageRange = validResult ? `${Math.min(...validResult.damage as number[])}-${Math.max(...validResult.damage as number[])}` : null;
  const maxHp = validResult ? validResult.defender.maxHP() : null;
  const pctRange =
    validResult && maxHp
      ? `${((Math.min(...(validResult.damage as number[])) / maxHp) * 100).toFixed(1)} - ${((Math.max(...(validResult.damage as number[])) / maxHp) * 100).toFixed(1)}%`
      : null;
  const koChance = validResult?.kochance?.();

  function handleSave() {
    if (!validResult) return;
    setSaveState('saving');
    startTransition(async () => {
      try {
        await saveCalculation({
          attackerSpeciesName: attacker.species,
          defenderSpeciesName: defender.species,
          attackerConfig: attacker,
          defenderConfig: defender,
          moveName,
          fieldConfig: field,
          resultSummary: {
            damage: validResult.damage,
            desc: validResult.desc(),
            kochance: koChance,
          },
        });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard padding="lg">
          <PokemonConfigPanel label="Atacante" value={attacker} onChange={setAttacker} />
        </GlassCard>
        <GlassCard padding="lg">
          <PokemonConfigPanel label="Defensor" value={defender} onChange={setDefender} />
        </GlassCard>
      </div>

      <GlassCard padding="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Golpe</label>
            <Combobox
              iconKind="move"
              options={MOVE_OPTIONS.map((m) => ({ value: m.value, moveType: m.type, moveCategory: m.category }))}
              defaultValue={moveName}
              placeholder="ex.: Earthquake"
              onValueChange={setMoveName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Clima</label>
            <Select value={field.weather} onChange={(e) => setField({ ...field, weather: e.target.value })}>
              {WEATHER_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Terreno</label>
            <Select value={field.terrain} onChange={(e) => setField({ ...field, terrain: e.target.value })}>
              {TERRAIN_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 justify-center">
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={field.isReflect}
                onChange={(e) => setField({ ...field, isReflect: e.target.checked })}
                className="h-3.5 w-3.5 accent-purple-core"
              />
              Reflect (defensor)
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={field.isLightScreen}
                onChange={(e) => setField({ ...field, isLightScreen: e.target.checked })}
                className="h-3.5 w-3.5 accent-purple-core"
              />
              Light Screen (defensor)
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={field.isHelpingHand}
                onChange={(e) => setField({ ...field, isHelpingHand: e.target.checked })}
                className="h-3.5 w-3.5 accent-purple-core"
              />
              Helping Hand (atacante)
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={field.isCrit}
                onChange={(e) => setField({ ...field, isCrit: e.target.checked })}
                className="h-3.5 w-3.5 accent-purple-core"
              />
              Critical Hit
            </label>
          </div>
        </div>
      </GlassCard>

      <GlassCard padding="lg" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-purple-neon" strokeWidth={1.75} />
          <h2 className="font-display text-base font-semibold text-ink-primary">Resultado</h2>
        </div>

        {!attacker.species || !defender.species || !moveName ? (
          <p className="text-sm text-ink-muted">
            Escolha atacante, defensor e o golpe para calcular o dano.
          </p>
        ) : hasError ? (
          <p className="text-sm text-danger">Não foi possível calcular: {(result as { error: string }).error}</p>
        ) : validResult ? (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-sm text-ink-primary">{validResult.desc()}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-ink-dim">Dano</p>
                <p className="font-mono text-lg text-ink-primary">{damageRange}</p>
              </div>
              <div>
                <p className="text-xs text-ink-dim">% do HP</p>
                <p className="font-mono text-lg text-ink-primary">{pctRange}</p>
              </div>
              <div>
                <p className="text-xs text-ink-dim">Chance de KO</p>
                <Badge tone={koChance?.chance === 1 ? 'success' : 'purple'}>{koChance?.text ?? '—'}</Badge>
              </div>
            </div>
            <Button size="sm" variant="secondary" className="w-fit" onClick={handleSave} disabled={isPending}>
              <Save className="h-3.5 w-3.5" />
              {saveState === 'saved' ? 'Salvo!' : saveState === 'error' ? 'Erro ao salvar' : 'Salvar cálculo'}
            </Button>
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
