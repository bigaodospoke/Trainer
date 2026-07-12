import Link from 'next/link';
import Image from 'next/image';
import { Handshake, CalendarDays } from 'lucide-react';
import { getApprovedPartners } from '@/lib/partners/queries';
import { PARTNER_CATEGORY_LABELS, PARTNER_CATEGORIES, PARTNER_TIER_LABELS, PARTNER_TIER_COLORS } from '@/lib/partners/constants';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface PartnersPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function PartnersPage({ searchParams }: PartnersPageProps) {
  const { category } = await searchParams;
  const partners = await getApprovedPartners({ category });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Servidores Parceiros</h1>
          <p className="text-sm text-ink-muted">Comunidades Cobblemon parceiras do Trainerly.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/partners">
          <Badge tone={!category ? 'purple' : 'neutral'} className="cursor-pointer">Todos</Badge>
        </Link>
        {PARTNER_CATEGORIES.map((c) => (
          <Link key={c} href={`/partners?category=${c}`}>
            <Badge tone={category === c ? 'purple' : 'neutral'} className="cursor-pointer">
              {PARTNER_CATEGORY_LABELS[c]}
            </Badge>
          </Link>
        ))}
      </div>

      {partners.length === 0 ? (
        <GlassCard padding="lg">
          <EmptyState title="Nenhum parceiro por aqui ainda" description="Em breve novos servidores Cobblemon parceiros do Trainerly." />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p: (typeof partners)[number]) => (
            <Link key={p.id} href={`/partners/${p.slug}`}>
              <GlassCard
                padding="lg"
                hover
                className="flex h-full flex-col gap-3"
                style={p.tier === 'PARCEIRO_ELITE' || p.tier === 'PARCEIRO_PRO' ? { borderColor: `${PARTNER_TIER_COLORS[p.tier]}55` } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {p.logoUrl ? (
                      <Image src={p.logoUrl} alt={p.name} width={48} height={48} unoptimized className="object-cover" />
                    ) : (
                      <Handshake className="h-5 w-5 text-ink-dim" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-primary">{p.name}</p>
                    {(p.tier === 'PARCEIRO_ELITE' || p.tier === 'PARCEIRO_PRO' || p.tier === 'PARCEIRO_PLUS') && (
                      <span className="text-[10px] font-medium" style={{ color: PARTNER_TIER_COLORS[p.tier] }}>
                        {PARTNER_TIER_LABELS[p.tier]}
                      </span>
                    )}
                  </div>
                </div>
                <p className="line-clamp-2 flex-1 text-xs text-ink-muted">{p.description}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.categories.slice(0, 3).map((c: string) => (
                    <Badge key={c} tone="neutral">{PARTNER_CATEGORY_LABELS[c]}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-dim">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {p._count.events} {p._count.events === 1 ? 'evento ativo' : 'eventos ativos'}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
