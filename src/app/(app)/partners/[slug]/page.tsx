import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import {
  Globe, Store, Instagram, Youtube, ArrowLeft, CalendarDays, Newspaper, ShieldBan, ListOrdered, Images, Swords,
} from 'lucide-react';
import { getPartnerBySlug } from '@/lib/partners/queries';
import { logPartnerEvent, hashVisitor } from '@/lib/partners/analytics';
import {
  PARTNER_SERVER_STATUS_LABELS, PARTNER_CATEGORY_LABELS, PARTNER_TIER_RANK_ORDER, PARTNER_TIER_LABELS, PARTNER_TIER_COLORS,
} from '@/lib/partners/constants';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { TeamSlotCard } from '@/components/team-builder/team-slot-card';
import { PokemonIcon } from '@/components/team-builder/sprite-icon';
import { buildExportTeamText, type ExportableSlot } from '@/lib/team-builder/showdown-format';
import { CopyExportButton } from '@/app/(app)/library/[teamId]/copy-export-button';

interface PartnerDetailPageProps {
  params: Promise<{ slug: string }>;
}

const DISCORD_ICON_PATH =
  'M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.075.037c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.076-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10 10 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.9 19.9 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028';

function buildTrackedUrl(partnerId: string, type: string, to: string, refId?: string) {
  const params = new URLSearchParams({ partnerId, type, to });
  if (refId) params.set('refId', refId);
  return `/api/partners/track?${params.toString()}`;
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { slug } = await params;
  const server = await getPartnerBySlug(slug);
  if (!server || server.status !== 'APPROVED') notFound();

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = hdrs.get('user-agent') ?? 'unknown';
  await logPartnerEvent(server.id, 'PAGE_VIEW', { visitorHash: hashVisitor(ip, userAgent) });

  const tierMeta = PARTNER_TIER_COLORS[server.tier as keyof typeof PARTNER_TIER_COLORS];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar aos parceiros
      </Link>

      <GlassCard padding="none" className="overflow-hidden">
        <div
          className="relative h-40 w-full bg-gradient-to-br from-purple-deep to-purple-core sm:h-56"
          style={server.bannerUrl ? { backgroundImage: `url(${server.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:gap-6">
          <div className="-mt-16 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-void bg-void-elevated sm:h-28 sm:w-28">
            {server.logoUrl ? (
              <Image src={server.logoUrl} alt={server.name} width={112} height={112} unoptimized className="object-cover" />
            ) : (
              <Swords className="h-8 w-8 text-ink-dim" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-ink-primary">{server.name}</h1>
              <Badge tone="purple" style={{ color: tierMeta }}>{PARTNER_TIER_LABELS[server.tier as keyof typeof PARTNER_TIER_LABELS]}</Badge>
              <Badge tone={server.serverStatus === 'ONLINE' ? 'success' : server.serverStatus === 'OFFLINE' ? 'neutral' : 'warning'}>
                {PARTNER_SERVER_STATUS_LABELS[server.serverStatus]}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">{server.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {server.categories.map((c: string) => <Badge key={c} tone="neutral">{PARTNER_CATEGORY_LABELS[c]}</Badge>)}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {server.serverIp && <InfoBox label="IP" value={server.serverIp} mono />}
        {server.minecraftVersion && <InfoBox label="Versão" value={server.minecraftVersion} />}
        {server.modpack && <InfoBox label="Modpack" value={server.modpack} />}
        {server.region && <InfoBox label="Região" value={server.region} />}
      </div>

      <div className="flex flex-wrap gap-2">
        {server.discordUrl && (
          <LinkButton href={buildTrackedUrl(server.id, 'DISCORD_CLICK', server.discordUrl)} label="Discord">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d={DISCORD_ICON_PATH} /></svg>
          </LinkButton>
        )}
        {server.websiteUrl && <LinkButton href={buildTrackedUrl(server.id, 'WEBSITE_CLICK', server.websiteUrl)} label="Site"><Globe className="h-4 w-4" /></LinkButton>}
        {server.storeUrl && <LinkButton href={buildTrackedUrl(server.id, 'STORE_CLICK', server.storeUrl)} label="Loja"><Store className="h-4 w-4" /></LinkButton>}
        {server.instagramUrl && <LinkButton href={server.instagramUrl} label="Instagram"><Instagram className="h-4 w-4" /></LinkButton>}
        {server.youtubeUrl && <LinkButton href={server.youtubeUrl} label="YouTube"><Youtube className="h-4 w-4" /></LinkButton>}
        {server.tiktokUrl && <LinkButton href={server.tiktokUrl} label="TikTok"><span className="text-xs font-bold">TT</span></LinkButton>}
      </div>

      {server.events.length > 0 && (
        <SectionCard title="Eventos" icon={<CalendarDays className="h-4 w-4 text-purple-neon" />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {server.events.map((ev: (typeof server.events)[number]) => {
              const content = (
                <GlassCard padding="md" hover={!!ev.link} className="flex h-full flex-col gap-1">
                  {ev.coverImageUrl && (
                    <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg">
                      <Image src={ev.coverImageUrl} alt={ev.title} fill unoptimized className="object-cover" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-ink-primary">{ev.title}</p>
                  <p className="text-xs text-ink-dim">{new Date(ev.eventDate).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-ink-muted">{ev.description}</p>
                </GlassCard>
              );
              return ev.link ? (
                <a key={ev.id} href={buildTrackedUrl(server.id, 'EVENT_CLICK', ev.link, ev.id)}>{content}</a>
              ) : (
                <div key={ev.id}>{content}</div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {server.news.length > 0 && (
        <SectionCard title="Notícias" icon={<Newspaper className="h-4 w-4 text-purple-neon" />}>
          <div className="flex flex-col gap-3">
            {server.news.map((n: (typeof server.news)[number]) => (
              <GlassCard key={n.id} padding="md" className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                {n.coverImageUrl && (
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg sm:w-40">
                    <Image src={n.coverImageUrl} alt={n.title} fill unoptimized className="object-cover" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-ink-primary">{n.title}</p>
                  <p className="mb-1 text-xs text-ink-dim">{new Date(n.publishedAt).toLocaleDateString('pt-BR')}</p>
                  <p className="text-sm text-ink-muted">{n.content}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </SectionCard>
      )}

      {server.tierEntries.length > 0 && (
        <SectionCard title="Tier List Competitiva" icon={<ListOrdered className="h-4 w-4 text-purple-neon" />}>
          <div className="flex flex-col gap-3">
            {PARTNER_TIER_RANK_ORDER.map((rank) => {
              const entries = server.tierEntries.filter((e: (typeof server.tierEntries)[number]) => e.rank === rank);
              if (entries.length === 0) return null;
              return (
                <div key={rank} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 rounded-lg bg-purple-core/20 py-1 text-center font-mono text-sm font-bold text-purple-neon">{rank}</span>
                  <div className="flex flex-wrap gap-2">
                    {entries.map((e: (typeof server.tierEntries)[number]) => (
                      <span key={e.id} className="flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/5 px-2 py-1 text-xs text-ink-primary">
                        <PokemonIcon icon={e.species} alt={e.species.name} />
                        {e.species.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {server.banEntries.length > 0 && (
        <SectionCard title="Banlist" icon={<ShieldBan className="h-4 w-4 text-danger" />}>
          <div className="flex flex-wrap gap-2">
            {server.banEntries.map((e: (typeof server.banEntries)[number]) => (
              <span key={e.id} className="flex items-center gap-1.5 rounded-pill border border-danger/30 bg-danger/10 px-2 py-1 text-xs text-danger" title={e.reason ?? undefined}>
                <PokemonIcon icon={e.species} alt={e.species.name} />
                {e.species.name}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {server.specialRules && (
        <SectionCard title="Regras especiais" icon={<ListOrdered className="h-4 w-4 text-purple-neon" />}>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{server.specialRules}</p>
        </SectionCard>
      )}

      {server.teams.length > 0 && (
        <SectionCard title="Times recomendados" icon={<Swords className="h-4 w-4 text-purple-neon" />}>
          <div className="flex flex-col gap-4">
            {server.teams.map((t: (typeof server.teams)[number]) => {
              const exportableSlots: ExportableSlot[] = t.slots.map((slot: (typeof t.slots)[number]) => ({
                speciesName: slot.species.name,
                nickname: slot.nickname,
                gender: slot.gender,
                itemName: slot.item?.name ?? null,
                abilityName: slot.ability?.name ?? null,
                teraType: slot.teraType,
                nature: slot.natureName,
                level: slot.level,
                shiny: slot.shiny,
                evs: { hp: slot.evHp, atk: slot.evAtk, def: slot.evDef, spa: slot.evSpa, spd: slot.evSpd, spe: slot.evSpe },
                ivs: { hp: slot.ivHp, atk: slot.ivAtk, def: slot.ivDef, spa: slot.ivSpa, spd: slot.ivSpd, spe: slot.ivSpe },
                moveNames: slot.moves.map((m: (typeof slot.moves)[number]) => m.move.name),
              }));
              const exportText = buildExportTeamText(exportableSlots);
              return (
                <div key={t.id}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-primary">{t.name}</p>
                      <p className="text-xs text-ink-dim">
                        por @{server.owner.username} · {t.battleFormat}{t.format ? ` · ${t.format.name}` : ''}
                      </p>
                    </div>
                    <CopyExportButton teamId={t.id} exportText={exportText} downloadsCount={t.downloadsCount} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {t.slots.map((slot: (typeof t.slots)[number]) => <TeamSlotCard key={slot.id} slot={slot} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {server.images.length > 0 && (
        <SectionCard title="Galeria" icon={<Images className="h-4 w-4 text-purple-neon" />}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {server.images.map((img: (typeof server.images)[number]) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
                <Image src={img.imageUrl} alt={img.caption ?? server.name} fill unoptimized className="object-cover" />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="font-display text-sm font-semibold text-ink-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoBox({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <GlassCard padding="md">
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-dim">{label}</p>
      <p className={`text-sm text-ink-primary ${mono ? 'font-mono' : ''}`}>{value}</p>
    </GlassCard>
  );
}

function LinkButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-ink-primary transition-colors hover:border-purple-neon/40"
    >
      {children}
      {label}
    </a>
  );
}
