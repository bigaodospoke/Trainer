import { Heart, Trophy, ExternalLink } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getActiveSupporters,
  getOrCreatePlatformCards,
  groupSupportersByTier,
  SUPPORTER_TIER_ORDER,
  SUPPORTER_TIER_META,
  type SupporterListItem,
} from '@/lib/supporters/queries';

const DEFAULT_MESSAGE =
  'Gostou do projeto e quer ajudar a manter ele ativo? Qualquer apoio faz diferença e ajuda a trazer novas funcionalidades, melhorias e conteúdos para a comunidade.';

export default async function ApoiadoresPage() {
  const [supporters, platformCardsRaw] = await Promise.all([
    getActiveSupporters(),
    getOrCreatePlatformCards(),
  ]);
  const platformCards = platformCardsRaw.filter((p) => p.link);
  const grouped = groupSupportersByTier(supporters);
  const ranking = supporters.slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Apoiadores</h1>
          <p className="max-w-2xl text-sm text-ink-muted">{DEFAULT_MESSAGE}</p>
        </div>
      </div>

      {platformCards.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Apoie o projeto</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {platformCards.map((p: (typeof platformCards)[number]) => (
              <a key={p.id} href={p.link!} target="_blank" rel="noopener noreferrer" className="block h-full">
                <GlassCard padding="lg" hover className="flex h-full flex-col items-center gap-3 text-center">
                  <Avatar src={p.photoUrl} name={p.name} size={56} />
                  <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink-primary">
                    {p.name}
                    <ExternalLink className="h-3 w-3 text-ink-dim" strokeWidth={1.75} />
                  </p>
                  <p className="text-xs text-ink-muted">{p.message || DEFAULT_MESSAGE}</p>
                </GlassCard>
              </a>
            ))}
          </div>
        </div>
      )}

      {supporters.length === 0 ? (
        <EmptyState
          title="Ainda sem apoiadores cadastrados"
          description="Quando alguém apoiar o projeto, aparece aqui, organizado por categoria."
        />
      ) : (
        <>
          <GlassCard padding="lg">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-ink-primary">
              <Trophy className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
              Ranking de maiores apoiadores
            </h2>
            <div className="flex flex-col gap-2">
              {ranking.map((s: SupporterListItem, i: number) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <span className="w-5 text-center font-mono text-xs text-ink-dim">{i + 1}</span>
                  <Avatar src={s.photoUrl} name={s.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-primary">{s.name}</p>
                    {s.role && <p className="truncate text-xs text-ink-dim">{s.role}</p>}
                  </div>
                  <TierPill tier={s.tier as keyof typeof SUPPORTER_TIER_META} />
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPORTER_TIER_ORDER.map((tier) => {
              const meta = SUPPORTER_TIER_META[tier];
              const members = grouped.get(tier) ?? [];
              return (
                <GlassCard key={tier} padding="lg">
                  <h3 className="mb-1 font-display text-sm font-semibold" style={{ color: meta.color }}>
                    {'⭐'.repeat(meta.stars)} {meta.label}
                  </h3>
                  <p className="mb-4 text-xs text-ink-dim">
                    {members.length} {members.length === 1 ? 'apoiador' : 'apoiadores'}
                  </p>
                  {members.length === 0 ? (
                    <p className="text-xs text-ink-dim">Nenhum apoiador nesta categoria ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {members.map((s) => (
                        <div key={s.id} className="flex items-center gap-2.5">
                          <Avatar src={s.photoUrl} name={s.name} size={28} />
                          <div>
                            <p className="text-sm text-ink-primary">{s.name}</p>
                            {s.role && <p className="text-[11px] text-ink-dim">{s.role}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TierPill({ tier }: { tier: keyof typeof SUPPORTER_TIER_META }) {
  const meta = SUPPORTER_TIER_META[tier];
  return (
    <span
      className="rounded-pill border px-2 py-0.5 text-[11px] font-medium"
      style={{ color: meta.color, borderColor: `${meta.color}55` }}
    >
      {'⭐'.repeat(meta.stars)} {meta.label}
    </span>
  );
}
