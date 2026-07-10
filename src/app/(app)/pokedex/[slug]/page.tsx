import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSpeciesDetail, getCommonTeammates } from '@/lib/pokedex/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { TypeBadge } from '@/components/ui/type-badge';
import { StatBar } from '@/components/ui/stat-bar';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { DexSprite } from '@/components/pokedex/dex-sprite';

interface PokedexDetailPageProps {
  params: Promise<{ slug: string }>;
}

const METHOD_LABELS: Record<string, string> = {
  LEVEL_UP: 'Level up',
  TM: 'TM/TR',
  EGG: 'Egg',
  TUTOR: 'Tutor',
  EVENT: 'Evento',
  VIRTUAL_CONSOLE: 'Virtual Console',
  OTHER: 'Outro',
};
const METHOD_ORDER = ['LEVEL_UP', 'TM', 'EGG', 'TUTOR', 'EVENT', 'VIRTUAL_CONSOLE', 'OTHER'];

export default async function PokedexDetailPage({ params }: PokedexDetailPageProps) {
  const { slug } = await params;
  const species = await getSpeciesDetail(slug);
  if (!species) notFound();

  const teammates = await getCommonTeammates(species.id);

  // Agrupa learnset por metodo, deduplicando por golpe (mantendo a entrada
  // de geracao mais recente — relevante pro nivel exibido em LEVEL_UP).
  const byMethod = new Map<string, Map<string, (typeof species.learnset)[number]>>();
  for (const entry of species.learnset) {
    if (!byMethod.has(entry.method)) byMethod.set(entry.method, new Map());
    const group = byMethod.get(entry.method)!;
    const existing = group.get(entry.moveId);
    if (!existing || entry.generation > existing.generation) {
      group.set(entry.moveId, entry);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/pokedex" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar à Pokédex
      </Link>

      <GlassCard padding="lg">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <DexSprite
            name={species.name}
            normalUrl={species.spriteAnimatedUrl ?? ''}
            shinyUrl={species.spriteShinyAnimatedUrl ?? ''}
          />

          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-ink-primary">{species.name}</h1>
              <span className="font-mono text-sm text-ink-dim">#{String(species.nationalDex).padStart(4, '0')}</span>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {species.types.map((t: string) => (
                <TypeBadge key={t} type={t} />
              ))}
              {species.tiers.map((ta: (typeof species.tiers)[number]) => (
                <Badge key={ta.formatId} tone="purple">
                  {ta.format.name}: {ta.tier}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-ink-dim">
              Geração {species.generationIntroduced}
              {species.weightKg ? ` · ${species.weightKg} kg` : ''} · {species.formKind.replace('_', ' ')}
            </p>

            {(species.prevo || species.evolutions.length > 0) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {species.prevo && (
                  <>
                    <EvoChip slug={species.prevo.slug} name={species.prevo.name} icon={species.prevo} />
                    <span className="text-ink-dim">→</span>
                  </>
                )}
                <EvoChip slug={species.slug} name={species.name} icon={species} current />
                {species.evolutions.map((evo: (typeof species.evolutions)[number]) => (
                  <span key={evo.slug} className="flex items-center gap-2">
                    <span className="text-ink-dim">→</span>
                    <EvoChip slug={evo.slug} name={evo.name} icon={evo} />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard padding="lg">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Stats base</h2>
          <div className="flex flex-col gap-2.5">
            <StatBar label="HP" value={species.baseHp} />
            <StatBar label="Atk" value={species.baseAtk} />
            <StatBar label="Def" value={species.baseDef} />
            <StatBar label="SpA" value={species.baseSpa} />
            <StatBar label="SpD" value={species.baseSpd} />
            <StatBar label="Spe" value={species.baseSpe} />
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Abilities</h2>
          <div className="flex flex-col gap-2">
            {species.abilities.map((pa: (typeof species.abilities)[number]) => (
              <div key={pa.abilityId} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-sm text-ink-primary">{pa.ability.name}</span>
                {pa.isHidden && <Badge tone="warning">Hidden</Badge>}
              </div>
            ))}
          </div>

          {teammates.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 font-display text-sm font-semibold text-ink-primary">
                Parceiros comuns (Gen 9 OU)
              </h2>
              <div className="flex flex-wrap gap-2">
                {teammates
  .filter((t): t is NonNullable<typeof t> => t !== null)
  .map((t) => (
    <Link
      key={t.slug}
      href={`/pokedex/${t.slug}`}
      className="flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-ink-muted hover:text-ink-primary"
    >
      {t.name} · {t.usagePercent.toFixed(1)}%
    </Link>
  ))}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Learnset</h2>
        <div className="flex flex-col gap-5">
          {METHOD_ORDER.filter((m) => byMethod.has(m)).map((method) => {
            const moves = [...byMethod.get(method)!.values()].sort((a, b) => {
              if (method === 'LEVEL_UP') return (a.levelLearnedAt ?? 0) - (b.levelLearnedAt ?? 0);
              return a.move.name.localeCompare(b.move.name);
            });
            return (
              <div key={method}>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">
                  {METHOD_LABELS[method] ?? method} ({moves.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {moves.map((entry) => (
                    <span
                      key={entry.moveId}
                      className="rounded-pill border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-ink-muted"
                    >
                      {method === 'LEVEL_UP' && entry.levelLearnedAt ? `Lv.${entry.levelLearnedAt} ` : ''}
                      {entry.move.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function EvoChip({
  slug,
  name,
  icon,
  current,
}: {
  slug: string;
  name: string;
  icon: { iconSheetUrl: string | null; iconTop: number | null; iconLeft: number | null };
  current?: boolean;
}) {
  return (
    <Link
      href={`/pokedex/${slug}`}
      className={`flex items-center gap-1.5 rounded-pill border px-2 py-1 text-xs ${
        current ? 'border-purple-neon/50 bg-purple-core/15 text-ink-primary' : 'border-white/10 text-ink-muted hover:text-ink-primary'
      }`}
    >
      <PokemonIcon icon={icon} alt={name} />
      {name}
    </Link>
  );
}
