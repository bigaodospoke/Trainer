import Link from 'next/link';
import { Users2, Plus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const STATUS_LABELS: Record<string, string> = {
  SETUP: 'Configurando',
  DRAFTING: 'Em draft',
  IN_SEASON: 'Em temporada',
  FINISHED: 'Finalizada',
};

export default async function DraftLeaguePage() {
  const session = await auth();
  const leagues = await prisma.draftLeague.findMany({
    where: { OR: [{ ownerId: session!.user.id }, { teams: { some: { ownerId: session!.user.id } } }] },
    orderBy: { createdAt: 'desc' },
    include: { format: true, teams: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users2 className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-primary">Draft League</h1>
            <p className="text-sm text-ink-muted">Ligas com sistema de pick/ban.</p>
          </div>
        </div>
        <Link href="/draft-league/new"><Button><Plus className="h-4 w-4" />Nova liga</Button></Link>
      </div>

      {leagues.length === 0 ? (
        <GlassCard padding="lg">
          <EmptyState
            title="Você não participa de nenhuma liga"
            description="Crie uma liga e adicione participantes — cada um draft a seu próprio elenco."
            action={<Link href="/draft-league/new"><Button size="sm">Criar liga</Button></Link>}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league: (typeof leagues)[number]) => (
            <Link key={league.id} href={`/draft-league/${league.id}`}>
              <GlassCard padding="md" hover>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-ink-primary">{league.name}</h3>
                  <Badge tone="purple">{STATUS_LABELS[league.status] ?? league.status}</Badge>
                </div>
                <p className="text-xs text-ink-dim">
                  {league.format?.name} · {league.teams.length} participante(s)
                </p>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
