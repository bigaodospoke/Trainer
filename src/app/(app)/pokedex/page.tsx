import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { searchSpecies } from '@/lib/pokedex/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { EmptyState } from '@/components/ui/empty-state';

const TYPES = [
  'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON',
  'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK',
  'STEEL', 'FAIRY', 'STELLAR',
];

interface PokedexPageProps {
  searchParams: Promise<{ q?: string; type?: string; gen?: string; page?: string }>;
}

export default async function PokedexPage({ searchParams }: PokedexPageProps) {
  const params = await searchParams;
  const { items, total, page, totalPages } = await searchSpecies({
    q: params.q,
    type: params.type,
    generation: params.gen ? Number(params.gen) : undefined,
    page: params.page ? Number(params.page) : 1,
  });

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ) as Record<string, string>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Pokédex</h1>
          <p className="text-sm text-ink-muted">{total} espécies sincronizadas</p>
        </div>
      </div>

      <GlassCard padding="md">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Input name="q" defaultValue={params.q ?? ''} placeholder="Buscar por nome..." />
          </div>
          <select
            name="type"
            defaultValue={params.type ?? ''}
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          >
            <option value="">Todos os tipos</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            name="gen"
            defaultValue={params.gen ?? ''}
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          >
            <option value="">Todas as gerações</option>
            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((g) => (
              <option key={g} value={g}>
                Gen {g}
              </option>
            ))}
          </select>
          <Button type="submit" className="sm:col-span-4 sm:w-fit">
            Filtrar
          </Button>
        </form>
      </GlassCard>

      {items.length === 0 ? (
        <GlassCard padding="lg">
          <EmptyState
            title="Nenhuma espécie encontrada"
            description="Ajuste os filtros, ou rode npm run sync:showdown se a Pokédex estiver vazia."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((species: (typeof items)[number]) => (
            <Link key={species.slug} href={`/pokedex/${species.slug}`}>
              <GlassCard padding="sm" hover className="flex flex-col items-center gap-2 text-center">
                <PokemonIcon icon={species} alt={species.name} />
                <p className="text-xs font-medium text-ink-primary">{species.name}</p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {species.tiers[0] && <Badge tone="purple">{species.tiers[0].tier}</Badge>}
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
