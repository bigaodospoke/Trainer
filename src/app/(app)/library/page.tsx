import Link from 'next/link';
import Image from 'next/image';
import { Library, Heart, Download, MessageCircle } from 'lucide-react';
import { searchPublicTeams } from '@/lib/library/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PartnerSpotlight } from '@/components/partners/partner-spotlight';

interface LibraryPageProps {
  searchParams: Promise<{ q?: string; format?: string; gen?: string; sort?: string; page?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const { items, total, page, totalPages } = await searchPublicTeams({
    q: params.q,
    battleFormat: params.format,
    generation: params.gen ? Number(params.gen) : undefined,
    sort: params.sort === 'liked' ? 'liked' : 'recent',
    page: params.page ? Number(params.page) : 1,
  });

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ) as Record<string, string>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Library className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Biblioteca de Times</h1>
          <p className="text-sm text-ink-muted">{total} times públicos</p>
        </div>
      </div>

      <PartnerSpotlight />

      <GlassCard padding="md">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <Input name="q" defaultValue={params.q ?? ''} placeholder="Buscar por nome do time..." />
          </div>
          <select
            name="format"
            defaultValue={params.format ?? ''}
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          >
            <option value="">Todos os formatos</option>
            <option value="SINGLES">Singles</option>
            <option value="DOUBLES">Doubles</option>
            <option value="VGC">VGC</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <select
            name="sort"
            defaultValue={params.sort ?? 'recent'}
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          >
            <option value="recent">Mais recentes</option>
            <option value="liked">Mais curtidos</option>
          </select>
          <Button type="submit">Filtrar</Button>
        </form>
      </GlassCard>

      {items.length === 0 ? (
        <GlassCard padding="lg">
          <EmptyState
            title="Nenhum time público encontrado"
            description="Ajuste os filtros, ou publique um time seu no Team Builder (botão 'Privado' → 'Público')."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((team: (typeof items)[number]) => (
            <Link key={team.id} href={`/library/${team.id}`}>
              <GlassCard padding="md" hover className="flex h-full flex-col">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-ink-primary">{team.name}</h3>
                  <Badge tone="neutral">{team.battleFormat}</Badge>
                </div>
                <p className="mb-3 text-xs text-ink-dim">
                  por @{team.owner.username} · Gen {team.generation}
                  {team.format ? ` · ${team.format.name}` : ''}
                </p>

                <div className="mb-3 flex items-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const slot = team.slots.find((s: (typeof team.slots)[number]) => s.position === i + 1);
                    return (
                      <div key={i} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        {slot && (
                          <Image src={slot.species.spriteUrl ?? ''} alt={slot.species.name} width={28} height={28} unoptimized />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto flex items-center gap-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {team.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {team.commentsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" /> {team.downloadsCount}
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={`/library?${new URLSearchParams({ ...cleanParams, page: String(page - 1) }).toString()}`}>
              <Button variant="secondary" size="sm">
                Anterior
              </Button>
            </Link>
          )}
          <span className="text-sm text-ink-muted">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/library?${new URLSearchParams({ ...cleanParams, page: String(page + 1) }).toString()}`}>
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
