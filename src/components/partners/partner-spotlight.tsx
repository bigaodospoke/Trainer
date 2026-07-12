import Image from 'next/image';
import { Handshake, Sparkles } from 'lucide-react';
import { getSpotlightPartner } from '@/lib/partners/queries';
import { PARTNER_TIER_LABELS, PARTNER_TIER_COLORS } from '@/lib/partners/constants';
import { GlassCard } from '@/components/ui/glass-card';

/** Card de destaque rotativo pra parceiros Pro/Elite — usado na Home,
 *  Biblioteca de Times, Rankings e Pokedex (ver getSpotlightPartner pra
 *  logica de rotacao/peso por tier). Nao renderiza nada se nao houver
 *  parceiro elegivel, pra nunca deixar um espaco vazio na pagina. */
export async function PartnerSpotlight() {
  const partner = await getSpotlightPartner();
  if (!partner) return null;

  const tierColor = PARTNER_TIER_COLORS[partner.tier as keyof typeof PARTNER_TIER_COLORS];
  const href = `/api/partners/track?${new URLSearchParams({
    partnerId: partner.id,
    type: 'BANNER_CLICK',
    to: `/partners/${partner.slug}`,
  }).toString()}`;

  return (
    <a href={href}>
      <GlassCard padding="md" hover className="flex items-center gap-4" style={{ borderColor: `${tierColor}55` }}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {partner.logoUrl ? (
            <Image src={partner.logoUrl} alt={partner.name} width={48} height={48} unoptimized className="object-cover" />
          ) : (
            <Handshake className="h-5 w-5 text-ink-dim" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: tierColor }}>
            <Sparkles className="h-3 w-3" />
            Servidor parceiro · {PARTNER_TIER_LABELS[partner.tier as keyof typeof PARTNER_TIER_LABELS]}
          </p>
          <p className="truncate text-sm font-semibold text-ink-primary">{partner.name}</p>
          <p className="truncate text-xs text-ink-muted">{partner.description}</p>
        </div>
      </GlassCard>
    </a>
  );
}
