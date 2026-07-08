import Link from 'next/link';
import Image from 'next/image';
import { Plus, Swords } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default async function TeamBuilderPage() {
  const session = await auth();

  const teams = await prisma.team.findMany({
    where: { ownerId: session!.user.id },
    include: {
      format: true,
      slots: { include: { species: true }, orderBy: { position: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Team Builder</h1>
          <p className="text-sm text-ink-muted">Seus times — crie, edite e exporte para o Showdown.</p>
        </div>
        <Link href="/team-builder/new">
          <Button>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Novo time
          </Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <GlassCard padding="lg">
          <EmptyState
            title="Você ainda não tem times"
            description="Crie seu primeiro time competitivo — escolha o formato, a geração e o tier, depois monte os 6 slots."
            action={
              <Link href="/team-builder/new">
                <Button size="sm">Criar o primeiro time</Button>
              </Link>
            }
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: (typeof teams)[number]) => (
            <Link key={team.id} href={`/team-builder/${team.id}`}>
              <GlassCard padding="md" hover className="h-full">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-ink-primary">{team.name}</h3>
                  <Badge tone={team.isPublic ? 'success' : 'neutral'}>
                    {team.isPublic ? 'Público' : 'Privado'}
                  </Badge>
                </div>

                <div className="mb-4 flex items-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const slot = team.slots.find((s: (typeof team.slots)[number]) => s.position === i + 1);
                    return (
                      <div
                        key={i}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5"
                      >
                        {slot ? (
                          <Image src={slot.species.spriteUrl ?? ''} alt={slot.species.name} width={32} height={32} />
                        ) : (
                          <Swords className="h-3.5 w-3.5 text-ink-dim" strokeWidth={1.5} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>Gen {team.generation}</span>
                  <span>·</span>
                  <span>{team.battleFormat}</span>
                  {team.format && (
                    <>
                      <span>·</span>
                      <span>{team.format.name}</span>
                    </>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
