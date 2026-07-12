import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { getSpeciesDetail, getCommonTeammates } from '@/lib/pokedex/queries';
import { getOrFetchFlavorText } from '@/lib/pokedex/flavor-text';
import { computeTypeEffectiveness } from '@/lib/pokedex/type-effectiveness';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { TypeBadge } from '@/components/ui/type-badge';
import { StatBar } from '@/components/ui/stat-bar';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { DexSprite } from '@/components/pokedex/dex-sprite';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { isFavorited } from '@/lib/favorites/actions';
import { formatEvoCondition } from '@/lib/pokedex/evo-condition';
import { FORM_KIND_LABELS } from '@/lib/pokedex/form-kinds';

interface PokedexDetailPageProps {
  params: Promise<{ slug: string }>;
}

const METHOD_LABELS: Record<string, string> = {
  LEVEL_UP: 'Por nível',
  TM: 'Por TM/TR',
  EGG: 'Por ovo (Egg)',
  TUTOR: 'Por Tutor',
  EVENT: 'Evento',
  VIRTUAL_CONSOLE: 'Virtual Console',
  OTHER: 'Outro',
};
const METHOD_ORDER = ['LEVEL_UP', 'TM', 'EGG', 'TUTOR', 'EVENT', 'VIRTUAL_CONSOLE', 'OTHER'];

export default async function PokedexDetailPage({ params }: PokedexDetailPageProps) {
  const { slug } = await params;
  const species = await getSpeciesDetail(slug);
  if (!species) notFound();

  const [teammates, favorited, breeding] = await Promise.all([
    getCommonTeammates(species.id),
    isFavorited('POKEMON', species.id),
    getOrFetchFlavorText(species),
  ]);

  const effectiveness = computeTypeEffectiveness(species.types.map(toTitleCase));

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
    <div className="flex flex-col gap-4">
      <Link href="/pokedex" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar à Pokédex
      </Link>

      {/* Informações básicas — sempre visível: tipo, sprite, altura, peso, habilidades, descrição */}
      <GlassCard padding="lg">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <DexSprite
            name={species.name}
            normalUrl={species.spriteAnimatedUrl ?? ''}
            shinyUrl={species.spriteShinyAnimatedUrl ?? ''}
            nationalDex={species.nationalDex}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-ink-primary">{species.name}</h1>
              <span className="font-mono text-sm text-ink-dim">#{String(species.nationalDex).padStart(4, '0')}</span>
              {species.formKind !== 'BASE' && (
                <Badge tone="neutral">{FORM_KIND_LABELS[species.formKind] ?? species.formKind}</Badge>
              )}
              <FavoriteButton targetType="POKEMON" targetId={species.id} initialFavorited={favorited} size="sm" />
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {species.types.map((t: string) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <p className="mb-3 text-xs text-ink-dim">
              Geração {species.generationIntroduced}
              {species.heightM ? ` · ${species.heightM} m` : ''}
              {species.weightKg ? ` · ${species.weightKg} kg` : ''}
            </p>

            {breeding.flavorText && (
              <p className="mb-4 max-w-2xl text-sm italic text-ink-muted">“{breeding.flavorText}”</p>
            )}

            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-ink-dim">Habilidades</div>
            <div className="flex flex-wrap gap-2">
              {species.abilities.map((pa: (typeof species.abilities)[number]) => (
                <span
                  key={pa.abilityId}
                  className="flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-ink-primary"
                >
                  {pa.ability.name}
                  {pa.isHidden && <Badge tone="warning">Hidden</Badge>}
                </span>
              ))}
            </div>

            {(species.prevo || species.evolutions.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {species.prevo && (
                  <>
                    <EvoChip slug={species.prevo.slug} name={species.prevo.name} icon={species.prevo} />
                    <EvoArrow condition={formatEvoCondition(species)} />
                  </>
                )}
                <EvoChip slug={species.slug} name={species.name} icon={species} current />
                {species.evolutions.map((evo: (typeof species.evolutions)[number]) => (
                  <span key={evo.slug} className="flex items-center gap-2">
                    <EvoArrow condition={formatEvoCondition(evo)} />
                    <EvoChip slug={evo.slug} name={evo.name} icon={evo} />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Seções opcionais — expansíveis, fechadas por padrão pra não poluir a tela */}
      <Section title="Estatísticas base" defaultOpen>
        <div className="flex flex-col gap-2.5">
          <StatBar label="HP" value={species.baseHp} />
          <StatBar label="Atk" value={species.baseAtk} />
          <StatBar label="Def" value={species.baseDef} />
          <StatBar label="SpA" value={species.baseSpa} />
          <StatBar label="SpD" value={species.baseSpd} />
          <StatBar label="Spe" value={species.baseSpe} />
        </div>
      </Section>

      <Section title="Fraquezas e resistências">
        <div className="flex flex-col gap-4">
          <EffectivenessRow label="Fraquezas" rows={effectiveness.weaknesses} />
          <EffectivenessRow label="Resistências" rows={effectiveness.resistances} />
          <EffectivenessRow label="Imunidades" rows={effectiveness.immunities} />
          {effectiveness.weaknesses.length === 0 && effectiveness.resistances.length === 0 && effectiveness.immunities.length === 0 && (
            <p className="text-xs text-ink-dim">Sem fraquezas, resistências ou imunidades notáveis.</p>
          )}
        </div>
      </Section>

      <Section title="Movimentos (Learnset)">
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
          {species.learnset.length === 0 && (
            <p className="text-xs text-ink-dim">Nenhum golpe sincronizado para esta espécie.</p>
          )}
        </div>
      </Section>

      <Section title="Estratégias competitivas">
        <div className="flex flex-col gap-4">
          {species.tiers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {species.tiers.map((ta: (typeof species.tiers)[number]) => (
                <Badge key={ta.formatId} tone="purple">
                  {ta.format.name}: {ta.tier}
                </Badge>
              ))}
            </div>
          )}
          {teammates.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">Parceiros comuns (Gen 9 OU)</h3>
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
            </div>
          ) : (
            <p className="text-xs text-ink-dim">Sem dados de uso competitivo sincronizados para esta espécie.</p>
          )}
        </div>
      </Section>

      <Section title="Breeding">
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-ink-dim">Grupos de ovo: </span>
            <span className="text-ink-primary">
              {breeding.eggGroups.length > 0 ? breeding.eggGroups.map(toTitleCase).join(', ') : 'Desconhecido'}
            </span>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-ink-dim">Proporção de gênero: </span>
            <span className="text-ink-primary">
              {breeding.genderRatioFemale === null
                ? 'Sem gênero'
                : `${Math.round((1 - breeding.genderRatioFemale) * 100)}% macho / ${Math.round(breeding.genderRatioFemale * 100)}% fêmea`}
            </span>
          </div>
        </div>
      </Section>

      <Section title="Outros dados avançados">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <InfoField label="Dex Nacional" value={`#${species.nationalDex}`} />
          <InfoField label="Geração" value={String(species.generationIntroduced)} />
          <InfoField label="Categoria de forma" value={FORM_KIND_LABELS[species.formKind] ?? species.formKind} />
          <InfoField label="Pode Terastalizar" value={species.canTerastallize ? 'Sim' : 'Não'} />
          <InfoField label="Fonte dos dados" value={species.source} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group overflow-hidden rounded-card glass-panel">
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-ink-primary [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-ink-dim transition-transform group-open:rotate-180" strokeWidth={1.75} />
      </summary>
      <div className="border-t border-white/5 px-6 py-5">{children}</div>
    </details>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-dim">{label}</p>
      <p className="text-ink-primary">{value}</p>
    </div>
  );
}

function EffectivenessRow({ label, rows }: { label: string; rows: { type: string; multiplier: number }[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">{label}</h3>
      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <span key={r.type} className="flex items-center gap-1">
            <TypeBadge type={r.type} variant="icon" size="sm" />
            <span className="font-mono text-[10px] text-ink-dim">×{r.multiplier}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function EvoArrow({ condition }: { condition: string | null }) {
  return (
    <span className="flex flex-col items-center px-0.5">
      <span className="text-ink-dim">→</span>
      {condition && <span className="whitespace-nowrap text-[9px] leading-tight text-ink-dim">{condition}</span>}
    </span>
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

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
