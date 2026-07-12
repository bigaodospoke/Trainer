import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ValidationBanner } from '@/components/team-builder/validation-banner';
import { TeamBuilderSlotCard } from '@/components/team-builder/team-builder-slot-card';
import { TeamVisibilitySelect } from '@/components/team-builder/team-visibility-select';
import { computeTeamIssues } from '@/lib/team-builder/validation';
import { buildExportTeamText, type ExportableSlot } from '@/lib/team-builder/showdown-format';
import { deleteTeam, setTeamVisibility } from '../actions';
import { ImportExportPanel } from './import-export';

interface TeamEditorPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamEditorPage({ params }: TeamEditorPageProps) {
  const { teamId } = await params;
  const session = await auth();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      format: true,
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
  if (team.ownerId !== session!.user.id) redirect('/team-builder');

  const issues = await computeTeamIssues(team);

  const exportableSlots: ExportableSlot[] = team.slots.map((slot: (typeof team.slots)[number]) => ({
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
  const exportText = team.slots.length > 0 ? buildExportTeamText(exportableSlots) : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink-primary">{team.name}</h1>
            <Badge tone="purple">Gen {team.generation}</Badge>
            <Badge tone="neutral">{team.battleFormat}</Badge>
            {team.format && <Badge tone="neutral">{team.format.name}</Badge>}
          </div>
          <p className="text-sm text-ink-muted">{team.slots.length}/6 slots preenchidos</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TeamVisibilitySelect
            teamId={team.id}
            visibility={team.visibility}
            action={setTeamVisibility}
          />
          <form action={deleteTeam.bind(null, team.id)}>
            <Button type="submit" variant="danger" size="sm">
              <Trash2 className="h-3.5 w-3.5" />
              Excluir time
            </Button>
          </form>
        </div>
      </div>

      <ValidationBanner issues={issues} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => {
          const position = i + 1;
          const slot = team.slots.find((s: (typeof team.slots)[number]) => s.position === position);

          if (slot) {
            return <TeamBuilderSlotCard key={position} teamId={team.id} position={position} slot={slot} />;
          }

          return (
            <Link key={position} href={`/team-builder/${team.id}/slot/${position}`}>
              <GlassCard padding="sm" hover className="flex h-full min-h-[104px] flex-col items-center justify-center gap-2 text-center">
                <Plus className="h-6 w-6 text-ink-dim" strokeWidth={1.5} />
                <p className="text-xs text-ink-dim">Adicionar Pokémon</p>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      <ImportExportPanel teamId={team.id} exportText={exportText} />
    </div>
  );
}
