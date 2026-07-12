import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HofCard } from '@/components/hall-of-fame/hof-card';

interface HallOfFamePageProps {
  params: Promise<{ teamId: string }>;
}

export default async function HallOfFamePage({ params }: HallOfFamePageProps) {
  const { teamId } = await params;
  const session = await auth();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: { select: { username: true } },
      slots: {
        orderBy: { position: 'asc' },
        include: {
          species: true,
          item: true,
          ability: true,
          moves: { include: { move: true }, orderBy: { slot: 'asc' } },
        },
      },
    },
  });

  if (!team) notFound();
  const canView = team.ownerId === session!.user.id || team.isPublic || team.visibility === 'PUBLIC';
  if (!canView) redirect('/team-builder');

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/team-builder/${team.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao time
      </Link>

      {team.slots.length === 0 ? (
        <p className="text-sm text-ink-dim">Adicione Pokémon ao time antes de exportar o Hall of Fame.</p>
      ) : (
        <HofCard
          team={{
            name: team.name,
            battleFormat: team.battleFormat,
            ownerUsername: team.owner.username,
            slots: team.slots,
          }}
        />
      )}
    </div>
  );
}
