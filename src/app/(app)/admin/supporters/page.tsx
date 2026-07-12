import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, Link2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreatePlatformCards } from '@/lib/supporters/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  createSupporter,
  updateSupporter,
  updatePlatformLink,
  toggleSupporterActive,
  deleteSupporter,
} from '../supporters-actions';

const TIERS = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const;
const PLATFORMS = ['MANUAL', 'PIX', 'APOIA_SE', 'KOFI', 'PATREON'] as const;
const PLATFORM_LABELS: Record<(typeof PLATFORMS)[number], string> = {
  MANUAL: 'Manual',
  PIX: 'Pix',
  APOIA_SE: 'Apoia.se',
  KOFI: 'Ko-fi',
  PATREON: 'Patreon',
};

export default async function AdminSupportersPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/dashboard');

  const [platformCards, supporters] = await Promise.all([
    getOrCreatePlatformCards(),
    prisma.supporter.findMany({
      where: { isPlatformCard: false },
      orderBy: [{ isActive: 'desc' }, { tier: 'desc' }, { totalAmountCents: 'desc' }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar à administração
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Apoiadores</h1>
          <p className="text-sm text-ink-muted">
            Plataformas de apoio (links de pagamento) e apoiadores individuais são gerenciados separadamente.
          </p>
        </div>
      </div>

      <GlassCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-purple-neon" strokeWidth={1.75} />
          <h2 className="font-display text-sm font-semibold text-ink-primary">Plataformas de apoio</h2>
        </div>
        <p className="mb-4 text-xs text-ink-dim">
          Pix, Ko-fi e Patreon já estão criados — só cole o link de pagamento de cada um.
        </p>
        <div className="flex flex-col gap-4">
          {platformCards.map((p: (typeof platformCards)[number]) => (
            <details key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02]" open={!p.link}>
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                <Avatar src={p.photoUrl} name={p.name} size={32} />
                <div className="flex-1">
                  <p className="text-sm text-ink-primary">{p.name}</p>
                  <p className="text-xs text-ink-dim">{p.link || 'Sem link cadastrado ainda'}</p>
                </div>
                <Badge tone={p.link ? 'success' : 'warning'}>{p.link ? 'Configurado' : 'Pendente'}</Badge>
              </summary>
              <div className="border-t border-white/5 px-4 py-4">
                <form action={updatePlatformLink.bind(null, p.id)} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
                        Link de pagamento
                      </label>
                      <Input name="link" type="url" defaultValue={p.link ?? ''} placeholder={`https://...`} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
                        Logo (URL, opcional)
                      </label>
                      <Input name="photoUrl" type="url" defaultValue={p.photoUrl ?? ''} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
                        Mensagem personalizada (opcional)
                      </label>
                      <textarea
                        name="message"
                        defaultValue={p.message ?? ''}
                        maxLength={280}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-dim outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
                        placeholder="Gostou do projeto e quer ajudar a manter ele ativo?"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" variant="secondary" className="w-fit">Salvar</Button>
                </form>
              </div>
            </details>
          ))}
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">Novo apoiador individual</h2>
        <form action={createSupporter} className="flex flex-col gap-4">
          <SupporterFields />
          <Button type="submit" className="w-fit">Adicionar</Button>
        </form>
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">
          Apoiadores individuais ({supporters.length})
        </h2>
        <div className="flex flex-col gap-4">
          {supporters.length === 0 && (
            <p className="text-xs text-ink-dim">Nenhum apoiador cadastrado ainda.</p>
          )}
          {supporters.map((s: (typeof supporters)[number]) => (
            <details key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02]">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                <Avatar src={s.photoUrl} name={s.name} size={32} />
                <div className="flex-1">
                  <p className="text-sm text-ink-primary">{s.name}</p>
                  <p className="text-xs text-ink-dim">{PLATFORM_LABELS[s.platform]} · {s.tier}</p>
                </div>
                <Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Ativo' : 'Inativo'}</Badge>
              </summary>

              <div className="flex flex-col gap-4 border-t border-white/5 px-4 py-4">
                <form action={updateSupporter.bind(null, s.id)} className="flex flex-col gap-4">
                  <SupporterFields defaults={s} />
                  <Button type="submit" size="sm" variant="secondary" className="w-fit">Salvar</Button>
                </form>

                <div className="flex gap-2 border-t border-white/5 pt-3">
                  <form action={toggleSupporterActive.bind(null, s.id, !s.isActive)}>
                    <Button type="submit" size="sm" variant="ghost">
                      {s.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </form>
                  <form action={deleteSupporter.bind(null, s.id)}>
                    <Button type="submit" size="sm" variant="danger">Excluir</Button>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

interface SupporterDefaults {
  name: string;
  role: string | null;
  photoUrl: string | null;
  link: string | null;
  message: string | null;
  tier: string;
  platform: string;
}

function SupporterFields({ defaults }: { defaults?: SupporterDefaults }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Nome</label>
        <Input name="name" defaultValue={defaults?.name ?? ''} required maxLength={80} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Cargo/descrição (opcional)</label>
        <Input name="role" defaultValue={defaults?.role ?? ''} maxLength={80} placeholder="ex.: Apoiador Diamante desde 2024" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Apoiou via</label>
        <Select name="platform" defaultValue={defaults?.platform ?? 'MANUAL'}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Tier</label>
        <Select name="tier" defaultValue={defaults?.tier ?? 'BRONZE'}>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Link (perfil, rede social... opcional)</label>
        <Input name="link" type="url" defaultValue={defaults?.link ?? ''} placeholder="https://..." />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Foto (URL, opcional)</label>
        <Input name="photoUrl" type="url" defaultValue={defaults?.photoUrl ?? ''} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Mensagem personalizada (opcional)</label>
        <textarea
          name="message"
          defaultValue={defaults?.message ?? ''}
          maxLength={280}
          rows={2}
          className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-dim outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          placeholder="Obrigado por apoiar o projeto!"
        />
      </div>
    </div>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
    />
  );
}
