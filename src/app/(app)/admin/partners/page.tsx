import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Handshake } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PARTNER_STATUS_LABELS, PARTNER_TIER_LABELS, PARTNER_TIER_ORDER } from '@/lib/partners/constants';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { approvePartner, rejectPartner, suspendPartner, deletePartner, setPartnerTier } from '../partners-actions';

export default async function AdminPartnersPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/dashboard');

  const partners = await prisma.partnerServer.findMany({
    include: { owner: { select: { username: true, avatarUrl: true, displayName: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  const statusTone = (s: string) => (s === 'APPROVED' ? 'success' : s === 'REJECTED' || s === 'SUSPENDED' ? 'danger' : 'warning');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar à administração
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Parceiros Cobblemon</h1>
          <p className="text-sm text-ink-muted">Aprove, rejeite ou suspenda servidores parceiros e ajuste o tier de cada um.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {partners.length === 0 && <p className="text-sm text-ink-dim">Nenhum servidor cadastrado ainda.</p>}
        {partners.map((p: (typeof partners)[number]) => (
          <GlassCard key={p.id} padding="lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={p.owner.avatarUrl} name={p.owner.displayName ?? p.owner.username} size={36} />
                <div>
                  <p className="text-sm font-semibold text-ink-primary">{p.name}</p>
                  <p className="text-xs text-ink-dim">
                    /partners/{p.slug} · dono @{p.owner.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(p.status) as 'success' | 'danger' | 'warning'}>{PARTNER_STATUS_LABELS[p.status]}</Badge>
                <form action={setPartnerTier.bind(null, p.id)} className="flex items-center gap-1.5">
                  <select
                    name="tier"
                    defaultValue={p.tier}
                    className="h-8 rounded-lg border border-white/10 bg-void-surface/80 px-2 text-xs text-ink-primary outline-none"
                  >
                    {PARTNER_TIER_ORDER.map((t) => (
                      <option key={t} value={t}>{PARTNER_TIER_LABELS[t]}</option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="ghost">Salvar</Button>
                </form>
              </div>
            </div>

            <p className="mt-2 max-w-2xl text-xs text-ink-muted">{p.description}</p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
              {p.status !== 'APPROVED' && (
                <form action={approvePartner.bind(null, p.id)}>
                  <Button type="submit" size="sm" variant="secondary">Aprovar</Button>
                </form>
              )}
              {p.status === 'APPROVED' && (
                <form action={suspendPartner.bind(null, p.id)}>
                  <Button type="submit" size="sm" variant="ghost">Suspender</Button>
                </form>
              )}
              {p.status !== 'REJECTED' && (
                <form action={rejectPartner.bind(null, p.id)} className="flex items-center gap-2">
                  <input name="reason" placeholder="Motivo da rejeição..." className="h-8 w-56 rounded-lg border border-white/10 bg-void-surface/80 px-2 text-xs text-ink-primary outline-none" />
                  <Button type="submit" size="sm" variant="danger">Rejeitar</Button>
                </form>
              )}
              <form action={deletePartner.bind(null, p.id)}>
                <Button type="submit" size="sm" variant="danger">Excluir</Button>
              </form>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
