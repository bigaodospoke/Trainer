import Link from 'next/link';
import { BookOpen, Sparkles, Scale } from 'lucide-react';
import { searchSpecies } from '@/lib/pokedex/queries';
import { resolveSearchIntent } from '@/lib/pokedex/universal-search';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { PokedexFormFilter } from '@/components/pokedex/form-filter';
import { PokedexControls } from '@/components/pokedex/pokedex-controls';
import { FORM_KIND_LABELS } from '@/lib/pokedex/form-kinds';
import { PartnerSpotlight } from '@/components/partners/partner-spotlight';

interface PokedexPageProps {
  searchParams: Promise<{ q?: string; type?: string; gens?: string; page?: string; forms?: string }>;
}

export default async function PokedexPage({ searchParams }: PokedexPageProps) {
  const params = await searchParams;
  // Sem `?forms=` na URL (primeira visita, sem preferencia salva ainda) —
  // Paradox e Ultra Beasts vem habilitados por padrao; string vazia
  // explicita (usuario desmarcou tudo no filtro) e respeitada como "nenhum".
  const formKinds = params.forms !== undefined ? params.forms.split(',').filter(Boolean) : ['PARADOX', 'ULTRA_BEAST'];
  const generations = params.gens ? params.gens.split(',').filter(Boolean).map(Number) : undefined;

  // Busca universal: reconhece automaticamente se o texto digitado e um
  // Pokemon, golpe, ability, tipo ou tier — sem o usuario escolher categoria.
  const intent = await resolveSearchIntent(params.q ?? '');

  const { items, total, page, totalPages } = await searchSpecies({
    q: intent.kind === 'name' ? params.q : undefined,
    type: intent.kind === 'type' ? intent.type : params.type,
    tier: intent.kind === 'tier' ? intent.tier : undefined,
    moveId: intent.kind === 'move' ? intent.moveId : undefined,
    abilityId: intent.kind === 'ability' ? intent.abilityId : undefined,
    generations,
    page: params.page ? Number(params.page) : 1,
    formKinds,
  });

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ) as Record<string, string>;

  const isFiltered = Boolean(params.q || params.type || params.gens);

  const intentLabel =
    intent.kind === 'move' ? `Pokémon que aprendem "${intent.moveName}"` :
    intent.kind === 'ability' ? `Pokémon com a ability "${intent.abilityName}"` :
    intent.kind === 'type' ? `Pokémon do tipo ${intent.type}` :
    intent.kind === 'tier' ? `Pokémon da tier ${intent.tier}` :
    null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-primary">Pokédex</h1>
            <p className="text-sm text-ink-muted">
              {total} {total === 1 ? 'espécie encontrada' : isFiltered ? 'espécies encontradas' : 'espécies sincronizadas'}
            </p>
          </div>
        </div>
        <Link href="/pokedex/compare">
          <Button variant="secondary" size="sm">
            <Scale className="h-3.5 w-3.5" />
            Compare Pokémon
          </Button>
        </Link>
      </div>

      <PartnerSpotlight />

      <GlassCard padding="md" className="relative z-30">
        <div className="flex flex-col gap-3">
          <PokedexControls />
          <div>
            <PokedexFormFilter />
          </div>
        </div>
      </GlassCard>

      {intentLabel && (
        <div className="flex items-center gap-2 text-sm text-purple-ice animate-fade-in-up">
          <Sparkles className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
          Busca inteligente: {intentLabel}
        </div>
      )}

      {items.length === 0 ? (
        <GlassCard padding="lg">
          <EmptyState
            title="Nenhuma espécie encontrada"
            description="Ajuste os filtros, ou rode npm run sync:showdown se a Pokédex estiver vazia."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((species: (typeof items)[number], i: number) => (
            <Link key={species.slug} href={`/pokedex/${species.slug}`}>
              <GlassCard
                padding="sm"
                hover
                className="flex flex-col items-center gap-2 text-center animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 24) * 12}ms` }}
              >
                <PokemonIcon icon={species} alt={species.name} />
                <p className="text-xs font-medium text-ink-primary">{species.name}</p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {species.tiers[0] && <Badge tone="purple">{species.tiers[0].tier}</Badge>}
                  {species.formKind !== 'BASE' && (
                    <Badge tone="neutral">{FORM_KIND_LABELS[species.formKind] ?? species.formKind}</Badge>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={`/pokedex?${new URLSearchParams({ ...cleanParams, page: String(page - 1) }).toString()}`}
            >
              <Button variant="secondary" size="sm">
                Anterior
              </Button>
            </Link>
          )}
          <span className="text-sm text-ink-muted">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/pokedex?${new URLSearchParams({ ...cleanParams, page: String(page + 1) }).toString()}`}
            >
              <Button variant="secondary" size="sm">
                Próxima
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
