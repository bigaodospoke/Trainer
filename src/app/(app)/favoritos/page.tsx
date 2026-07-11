import Link from 'next/link';
import { Heart } from 'lucide-react';
import { auth } from '@/lib/auth';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { TypeBadgeRow } from '@/components/ui/type-badge';
import { getFavoritesForUser } from '@/lib/favorites/actions';

export default async function FavoritosPage() {
  const session = await auth();
  const { species, teams } = await getFavoritesForUser(session!.user.id);

  const isEmpty = species.length === 0 && teams.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Meus Favoritos</h1>
          <p className="text-sm text-ink-muted">Pokémon e times que você marcou com ❤ na Pokédex e na Biblioteca.</p>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          title="Nada favoritado ainda"
          description="Clique no coração em qualquer Pokémon na Pokédex ou time na Biblioteca pra guardar aqui."
        />
      ) : (
        <>
          {species.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">Pokémon</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {species.map((s) => (
                  <Link key={s.id} href={`/pokedex/${s.slug}`}>
                    <GlassCard padding="sm" hover className="flex flex-col items-center gap-2 text-center">
                      <PokemonIcon icon={s} alt={s.name} />
                      <p className="text-xs font-medium text-ink-primary">{s.name}</p>
                      <TypeBadgeRow types={s.types} size="sm" />
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {teams.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">Times</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
                  <Link key={t.id} href={`/library/${t.id}`}>
                    <GlassCard padding="md" hover>
                      <p className="text-sm font-medium text-ink-primary">{t.name}</p>
                      <p className="text-xs text-ink-dim">
                        {t.format?.name} · por {t.owner.username}
                      </p>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
