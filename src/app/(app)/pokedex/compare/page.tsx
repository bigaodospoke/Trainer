import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Scale, Zap, Swords } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getAllSpeciesOptions } from '@/lib/team-builder/queries';
import { computeTypeEffectiveness } from '@/lib/pokedex/type-effectiveness';
import { GlassCard } from '@/components/ui/glass-card';
import { TypeBadge } from '@/components/ui/type-badge';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { ComparePicker } from '@/components/pokedex/compare-picker';

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

const STAT_KEYS = [
  { key: 'baseHp', label: 'HP' },
  { key: 'baseAtk', label: 'Atk' },
  { key: 'baseDef', label: 'Def' },
  { key: 'baseSpa', label: 'SpA' },
  { key: 'baseSpd', label: 'SpD' },
  { key: 'baseSpe', label: 'Spe' },
] as const;

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { a, b } = await searchParams;
  const speciesOptions = await getAllSpeciesOptions();
  const comboOptions = speciesOptions.map((s: (typeof speciesOptions)[number]) => ({
    value: s.name,
    icon: { iconSheetUrl: s.iconSheetUrl, iconTop: s.iconTop, iconLeft: s.iconLeft },
  }));

  const [speciesA, speciesB] = await Promise.all([
    a ? prisma.pokemonSpecies.findFirst({ where: { name: a }, include: { abilities: { include: { ability: true } } } }) : null,
    b ? prisma.pokemonSpecies.findFirst({ where: { name: b }, include: { abilities: { include: { ability: true } } } }) : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/pokedex" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar à Pokédex
      </Link>

      <div className="flex items-center gap-3">
        <Scale className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Compare Pokémon</h1>
          <p className="text-sm text-ink-muted">Compare stats, tipos e matchups lado a lado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ComparePicker slot="a" options={comboOptions} defaultValue={a ?? ''} />
        <ComparePicker slot="b" options={comboOptions} defaultValue={b ?? ''} />
      </div>

      {!speciesA || !speciesB ? (
        <GlassCard padding="lg">
          <EmptyState title="Escolha 2 Pokémon" description="Selecione um Pokémon em cada campo acima para comparar." />
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[speciesA, speciesB].map((sp) => (
              <GlassCard key={sp.id} padding="lg" className="flex flex-col items-center gap-2 text-center">
                <PokemonIcon icon={sp} alt={sp.name} />
                {sp.spriteAnimatedUrl && (
                  <Image src={sp.spriteAnimatedUrl} alt={sp.name} width={80} height={80} unoptimized style={{ imageRendering: 'pixelated' }} />
                )}
                <p className="font-display text-lg font-semibold text-ink-primary">{sp.name}</p>
                <div className="flex gap-1.5">
                  {sp.types.map((t: string) => <TypeBadge key={t} type={t} />)}
                </div>
                <p className="text-xs text-ink-dim">
                  {sp.heightM ? `${sp.heightM} m` : '—'} · {sp.weightKg ? `${sp.weightKg} kg` : '—'}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {sp.abilities.map((pa: (typeof sp.abilities)[number]) => (
                    <span key={pa.abilityId} className="rounded-pill border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-ink-primary">
                      {pa.ability.name}{pa.isHidden ? ' (Hidden)' : ''}
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard padding="lg">
            <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Stats base</h2>
            <div className="flex flex-col gap-3">
              {STAT_KEYS.map(({ key, label }) => {
                const valA = speciesA[key];
                const valB = speciesB[key];
                const max = Math.max(valA, valB, 1);
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`font-mono text-sm ${valA >= valB ? 'text-success' : 'text-ink-muted'}`}>{valA}</span>
                      <div className="h-2 w-full max-w-[140px] overflow-hidden rounded-pill bg-white/5">
                        <div className="ml-auto h-full rounded-pill bg-gradient-to-l from-purple-neon to-purple-deep" style={{ width: `${(valA / max) * 100}%` }} />
                      </div>
                    </div>
                    <span className="w-10 text-center text-[10px] font-medium uppercase text-ink-dim">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full max-w-[140px] overflow-hidden rounded-pill bg-white/5">
                        <div className="h-full rounded-pill bg-gradient-to-r from-purple-neon to-purple-deep" style={{ width: `${(valB / max) * 100}%` }} />
                      </div>
                      <span className={`font-mono text-sm ${valB >= valA ? 'text-success' : 'text-ink-muted'}`}>{valB}</span>
                    </div>
                  </div>
                );
              })}
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-white/5 pt-3 text-center">
                <div>
                  <p className="text-xs text-ink-dim">BST</p>
                  <p className="font-mono text-lg text-ink-primary">
                    {STAT_KEYS.reduce((s, { key }) => s + speciesA[key], 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-dim">BST</p>
                  <p className="font-mono text-lg text-ink-primary">
                    {STAT_KEYS.reduce((s, { key }) => s + speciesB[key], 0)}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GlassCard padding="lg" className="flex items-center gap-3">
              <Zap className="h-5 w-5 shrink-0 text-purple-neon" strokeWidth={1.75} />
              <div>
                <p className="text-xs text-ink-dim">Speed Comparison</p>
                <p className="text-sm text-ink-primary">
                  {speciesA.baseSpe === speciesB.baseSpe
                    ? 'Mesma Speed base — decide por IV/EV/item/nature.'
                    : `${speciesA.baseSpe > speciesB.baseSpe ? speciesA.name : speciesB.name} é mais rápido em Speed base (${Math.max(speciesA.baseSpe, speciesB.baseSpe)} vs ${Math.min(speciesA.baseSpe, speciesB.baseSpe)}).`}
                </p>
              </div>
            </GlassCard>
            <GlassCard padding="lg" className="flex items-center gap-3">
              <Swords className="h-5 w-5 shrink-0 text-purple-neon" strokeWidth={1.75} />
              <div>
                <p className="text-xs text-ink-dim">Offensive Comparison</p>
                <p className="text-sm text-ink-primary">
                  {(() => {
                    const offA = Math.max(speciesA.baseAtk, speciesA.baseSpa);
                    const offB = Math.max(speciesB.baseAtk, speciesB.baseSpa);
                    if (offA === offB) return 'Potencial ofensivo (maior de Atk/SpA) empatado.';
                    const winner = offA > offB ? speciesA.name : speciesB.name;
                    return `${winner} tem maior potencial ofensivo (${Math.max(offA, offB)} vs ${Math.min(offA, offB)} no melhor stat ofensivo).`;
                  })()}
                </p>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[speciesA, speciesB].map((sp) => {
              const eff = computeTypeEffectiveness(sp.types.map(toTitleCase));
              return (
                <GlassCard key={sp.id} padding="lg">
                  <h3 className="mb-3 font-display text-sm font-semibold text-ink-primary">{sp.name} — Matchup</h3>
                  <MatchupRow label="Fraquezas" rows={eff.weaknesses} />
                  <MatchupRow label="Resistências" rows={eff.resistances} />
                  <MatchupRow label="Imunidades" rows={eff.immunities} />
                </GlassCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MatchupRow({ label, rows }: { label: string; rows: { type: string; multiplier: number }[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-ink-dim">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <span key={r.type} className="flex items-center gap-1">
            <TypeBadge type={r.type} size="sm" />
            <span className="font-mono text-[10px] text-ink-dim">×{r.multiplier}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
