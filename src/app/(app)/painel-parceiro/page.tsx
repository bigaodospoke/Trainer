import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Handshake, ExternalLink, Trash2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPartnerAccess } from '@/lib/partners/constants';
import {
  PARTNER_STATUS_LABELS,
  PARTNER_SERVER_STATUS_LABELS,
  PARTNER_CATEGORY_LABELS,
  PARTNER_CATEGORIES,
  PARTNER_TIER_LABELS,
  PARTNER_TIER_RANK_ORDER,
} from '@/lib/partners/constants';
import { getPartnerServerForEdit } from '@/lib/partners/queries';
import { getPartnerMetrics } from '@/lib/partners/analytics';
import { getAllSpeciesOptions } from '@/lib/team-builder/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Combobox } from '@/components/team-builder/combobox';
import {
  createPartnerServer,
  updateServerInfo,
  updateServerLinks,
  addGalleryImage,
  removeGalleryImage,
  createEvent,
  deleteEvent,
  createNews,
  deleteNews,
  addTierEntry,
  removeTierEntry,
  addBanEntry,
  removeBanEntry,
  updateSpecialRules,
  linkRecommendedTeam,
  unlinkRecommendedTeam,
} from './actions';

export default async function PainelParceiroPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id }, select: { id: true, tags: true } });

  if (!user || !hasPartnerAccess(user.tags)) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Handshake className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Painel de Parceiro</h1>
        </div>
        <GlassCard padding="lg">
          <EmptyState
            title="Área restrita a parceiros"
            description="Essa área é liberada pra contas com a tag Parceiro (ou Plus/Pro/Elite). Fale com a administração pra se tornar um servidor parceiro Cobblemon do Trainerly."
          />
        </GlassCard>
      </div>
    );
  }

  const server = await getPartnerServerForEdit(user.id);

  if (!server) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Handshake className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Painel de Parceiro</h1>
        </div>
        <GlassCard padding="lg" className="max-w-lg">
          <h2 className="mb-1 font-display text-sm font-semibold text-ink-primary">Cadastre seu servidor</h2>
          <p className="mb-4 text-xs text-ink-dim">
            Depois de criar, seu servidor fica pendente de aprovação da administração antes de aparecer publicamente em /partners.
          </p>
          <form action={createPartnerServer} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Nome do servidor</label>
              <Input name="name" required maxLength={80} placeholder="ex.: Vila Gengar" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Descrição</label>
              <textarea
                name="description"
                rows={3}
                maxLength={600}
                className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
              />
            </div>
            <Button type="submit" className="w-fit">Criar servidor</Button>
          </form>
        </GlassCard>
      </div>
    );
  }

  const [speciesOptions, metrics, eligibleTeams] = await Promise.all([
    getAllSpeciesOptions(),
    getPartnerMetrics(server.id),
    prisma.team.findMany({ where: { ownerId: user.id, partnerId: null }, select: { id: true, name: true } }),
  ]);

  const speciesComboOptions = speciesOptions.map((s: (typeof speciesOptions)[number]) => ({
    value: s.name,
    icon: { iconSheetUrl: s.iconSheetUrl, iconTop: s.iconTop, iconLeft: s.iconLeft },
  }));

  const statusTone = server.status === 'APPROVED' ? 'success' : server.status === 'REJECTED' ? 'danger' : server.status === 'SUSPENDED' ? 'danger' : 'warning';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Handshake className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-primary">{server.name}</h1>
            <p className="text-sm text-ink-muted">Painel de Parceiro</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="purple">{PARTNER_TIER_LABELS[server.tier as keyof typeof PARTNER_TIER_LABELS]}</Badge>
          <Badge tone={statusTone as 'success' | 'danger' | 'warning'}>{PARTNER_STATUS_LABELS[server.status]}</Badge>
          {server.status === 'APPROVED' && (
            <Link href={`/partners/${server.slug}`} target="_blank">
              <Button size="sm" variant="secondary"><ExternalLink className="h-3.5 w-3.5" />Ver página</Button>
            </Link>
          )}
        </div>
      </div>

      {server.status === 'REJECTED' && server.rejectionReason && (
        <GlassCard padding="md" className="border-danger/30">
          <p className="text-sm text-danger">Rejeitado: {server.rejectionReason}</p>
        </GlassCard>
      )}

      <Section title="Métricas" defaultOpen>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Pageviews" value={metrics.pageViews} />
          <Metric label="Visitantes únicos" value={metrics.uniqueVisitors} />
          <Metric label="Cliques Discord" value={metrics.discordClicks} />
          <Metric label="Cliques Site" value={metrics.websiteClicks} />
          <Metric label="Cliques Loja" value={metrics.storeClicks} />
          <Metric label="Cliques em banners" value={metrics.bannerClicks} />
        </div>
        {metrics.topEvents.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">Eventos mais acessados</p>
            <div className="flex flex-col gap-1">
              {metrics.topEvents.map((e) => (
                <div key={e.refId} className="flex items-center justify-between text-sm">
                  <span className="text-ink-primary">{e.title}</span>
                  <span className="font-mono text-xs text-ink-dim">{e.clicks} cliques</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Informações do servidor" defaultOpen>
        <form action={updateServerInfo} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome do servidor"><Input name="name" defaultValue={server.name} required maxLength={80} /></Field>
            <Field label="Logo (URL)"><Input name="logoUrl" type="url" defaultValue={server.logoUrl ?? ''} /></Field>
            <Field label="Banner (URL)"><Input name="bannerUrl" type="url" defaultValue={server.bannerUrl ?? ''} /></Field>
            <Field label="IP do servidor"><Input name="serverIp" defaultValue={server.serverIp ?? ''} placeholder="play.vilagengar.com" /></Field>
            <Field label="Versão do Minecraft"><Input name="minecraftVersion" defaultValue={server.minecraftVersion ?? ''} placeholder="1.20.1" /></Field>
            <Field label="Modpack"><Input name="modpack" defaultValue={server.modpack ?? ''} /></Field>
            <Field label="Região"><Input name="region" defaultValue={server.region ?? ''} placeholder="Brasil" /></Field>
            <Field label="Status do servidor">
              <Select name="serverStatus" defaultValue={server.serverStatus}>
                {Object.entries(PARTNER_SERVER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Descrição</label>
            <textarea
              name="description"
              defaultValue={server.description}
              rows={3}
              maxLength={600}
              className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-dim">Categorias</label>
            <div className="flex flex-wrap gap-3">
              {PARTNER_CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-1.5 text-sm text-ink-primary">
                  <input type="checkbox" name="categories" value={c} defaultChecked={server.categories.includes(c as never)} className="h-3.5 w-3.5 accent-purple-neon" />
                  {PARTNER_CATEGORY_LABELS[c]}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-fit">Salvar informações</Button>
        </form>
      </Section>

      <Section title="Links">
        <form action={updateServerLinks} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Discord"><Input name="discordUrl" type="url" defaultValue={server.discordUrl ?? ''} /></Field>
            <Field label="Site"><Input name="websiteUrl" type="url" defaultValue={server.websiteUrl ?? ''} /></Field>
            <Field label="Loja"><Input name="storeUrl" type="url" defaultValue={server.storeUrl ?? ''} /></Field>
            <Field label="Instagram"><Input name="instagramUrl" type="url" defaultValue={server.instagramUrl ?? ''} /></Field>
            <Field label="YouTube"><Input name="youtubeUrl" type="url" defaultValue={server.youtubeUrl ?? ''} /></Field>
            <Field label="TikTok"><Input name="tiktokUrl" type="url" defaultValue={server.tiktokUrl ?? ''} /></Field>
          </div>
          <Button type="submit" className="w-fit">Salvar links</Button>
        </form>
      </Section>

      <Section title={`Galeria (${server.images.length})`}>
        <form action={addGalleryImage} className="mb-4 flex flex-wrap gap-2">
          <Input name="imageUrl" type="url" placeholder="URL da imagem" className="flex-1" required />
          <Input name="caption" placeholder="Legenda (opcional)" className="w-48" />
          <Button type="submit" size="sm">Adicionar</Button>
        </form>
        {server.images.length === 0 ? (
          <p className="text-xs text-ink-dim">Nenhuma imagem ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {server.images.map((img: (typeof server.images)[number]) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
                <Image src={img.imageUrl} alt={img.caption ?? ''} fill unoptimized className="object-cover" />
                <form action={removeGalleryImage.bind(null, img.id)} className="absolute right-1 top-1">
                  <button type="submit" className="flex h-6 w-6 items-center justify-center rounded-full bg-void/80 text-danger opacity-0 transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Eventos (${server.events.length})`}>
        <form action={createEvent} className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input name="title" placeholder="Título" required />
          <Input name="eventDate" type="date" required />
          <Input name="eventTime" type="time" />
          <Input name="coverImageUrl" type="url" placeholder="Imagem de capa (URL, opcional)" />
          <Input name="link" type="url" placeholder="Link (opcional)" />
          <textarea name="description" placeholder="Descrição" rows={2} className="rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary outline-none focus:border-purple-neon/50 sm:col-span-2" />
          <Button type="submit" size="sm" className="w-fit sm:col-span-2">Criar evento</Button>
        </form>
        <div className="flex flex-col gap-2">
          {server.events.map((ev: (typeof server.events)[number]) => (
            <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex-1">
                <p className="text-sm text-ink-primary">{ev.title}</p>
                <p className="text-xs text-ink-dim">{new Date(ev.eventDate).toLocaleString('pt-BR')}</p>
              </div>
              <form action={deleteEvent.bind(null, ev.id)}>
                <button type="submit" className="text-ink-dim hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </form>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Notícias (${server.news.length})`}>
        <form action={createNews} className="mb-4 flex flex-col gap-2">
          <Input name="title" placeholder="Título" required />
          <Input name="coverImageUrl" type="url" placeholder="Imagem de capa (URL, opcional)" />
          <textarea name="content" placeholder="Conteúdo" rows={3} required className="rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary outline-none focus:border-purple-neon/50" />
          <Button type="submit" size="sm" className="w-fit">Publicar</Button>
        </form>
        <div className="flex flex-col gap-2">
          {server.news.map((n: (typeof server.news)[number]) => (
            <div key={n.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex-1">
                <p className="text-sm text-ink-primary">{n.title}</p>
                <p className="text-xs text-ink-dim">{new Date(n.publishedAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <form action={deleteNews.bind(null, n.id)}>
                <button type="submit" className="text-ink-dim hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </form>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Meta competitivo">
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">Tier List</p>
            <form action={addTierEntry} className="mb-3 flex flex-wrap items-end gap-2">
              <div className="w-56"><Combobox name="speciesName" options={speciesComboOptions} placeholder="Pokémon..." /></div>
              <Select name="rank" className="w-24">
                {PARTNER_TIER_RANK_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
              <Button type="submit" size="sm">Adicionar</Button>
            </form>
            <div className="flex flex-col gap-2">
              {PARTNER_TIER_RANK_ORDER.map((rank) => {
                const entries = server.tierEntries.filter((e: (typeof server.tierEntries)[number]) => e.rank === rank);
                if (entries.length === 0) return null;
                return (
                  <div key={rank} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-purple-neon">{rank}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {entries.map((e: (typeof server.tierEntries)[number]) => (
                        <form key={e.id} action={removeTierEntry.bind(null, e.id)}>
                          <button type="submit" className="rounded-pill border border-white/10 bg-white/5 px-2 py-1 text-xs text-ink-primary hover:border-danger/50">
                            {e.species.name} ✕
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">Banlist</p>
            <form action={addBanEntry} className="mb-3 flex flex-wrap items-end gap-2">
              <div className="w-56"><Combobox name="speciesName" options={speciesComboOptions} placeholder="Pokémon..." /></div>
              <Input name="reason" placeholder="Motivo (opcional)" className="w-48" />
              <Button type="submit" size="sm">Banir</Button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {server.banEntries.map((e: (typeof server.banEntries)[number]) => (
                <form key={e.id} action={removeBanEntry.bind(null, e.id)}>
                  <button type="submit" className="rounded-pill border border-danger/30 bg-danger/10 px-2 py-1 text-xs text-danger hover:border-danger/60">
                    {e.species.name} ✕
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-dim">Regras especiais</p>
            <form action={updateSpecialRules} className="flex flex-col gap-2">
              <textarea
                name="specialRules"
                defaultValue={server.specialRules ?? ''}
                rows={4}
                maxLength={3000}
                className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary outline-none focus:border-purple-neon/50"
              />
              <Button type="submit" size="sm" className="w-fit">Salvar regras</Button>
            </form>
          </div>
        </div>
      </Section>

      <Section title={`Times recomendados (${server.teams.length})`}>
        {eligibleTeams.length > 0 && (
          <form action={linkRecommendedTeam} className="mb-4 flex items-end gap-2">
            <Select name="teamId" className="w-64">
              {eligibleTeams.map((t: (typeof eligibleTeams)[number]) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Button type="submit" size="sm">Publicar time</Button>
          </form>
        )}
        {server.teams.length === 0 ? (
          <p className="text-xs text-ink-dim">Nenhum time publicado — monte um no Team Builder e publique aqui.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {server.teams.map((t: (typeof server.teams)[number]) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex-1">
                  <p className="text-sm text-ink-primary">{t.name}</p>
                  <p className="text-xs text-ink-dim">{t.slots.length}/6 slots</p>
                </div>
                <Link href={`/team-builder/${t.id}`}><Button type="button" size="sm" variant="secondary">Editar</Button></Link>
                <form action={unlinkRecommendedTeam.bind(null, t.id)}>
                  <button type="submit" className="text-ink-dim hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </form>
              </div>
            ))}
          </div>
        )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">{label}</label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
      <p className="font-mono text-xl text-ink-primary">{value}</p>
      <p className="text-[10px] text-ink-dim">{label}</p>
    </div>
  );
}

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20 ${className ?? 'w-full'}`}
    />
  );
}
