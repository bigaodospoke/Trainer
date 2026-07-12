import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValidationBanner } from '@/components/team-builder/validation-banner';
import { TeamBuilderSlotCard } from '@/components/team-builder/team-builder-slot-card';
import { TeamVisibilitySelect } from '@/components/team-builder/team-visibility-select';
import { computeTeamIssues } from '@/lib/team-builder/validation';
import { getAllFormats } from '@/lib/team-builder/queries';
import { buildExportTeamText, type ExportableSlot } from '@/lib/team-builder/showdown-format';
import { deleteTeam, setTeamVisibility, updateTeamInfo } from '../actions';
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

  const [issues, formats] = await Promise.all([computeTeamIssues(team), getAllFormats()]);

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
          <Link href={`/team-builder/${team.id}/hall-of-fame`}>
            <Button type="button" variant="secondary" size="sm">
              <Trophy className="h-3.5 w-3.5" />
              Hall of Fame
            </Button>
          </Link>
          <form action={deleteTeam.bind(null, team.id)}>
            <Button type="submit" variant="danger" size="sm">
              <Trash2 className="h-3.5 w-3.5" />
              Excluir time
            </Button>
          </form>
        </div>
      </div>

      <details className="group overflow-hidden rounded-card glass-panel">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-3 text-sm font-medium text-ink-primary [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-ink-dim" />Editar informações do time</span>
          <ChevronDown className="h-4 w-4 text-ink-dim transition-transform group-open:rotate-180" strokeWidth={1.75} />
        </summary>
        <form action={updateTeamInfo.bind(null, team.id)} className="flex flex-col gap-4 border-t border-white/5 px-6 py-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Nome</label>
            <Input id="name" name="name" defaultValue={team.name} required maxLength={60} />
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Descrição</label>
            <textarea
              id="description"
              name="description"
              defaultValue={team.description ?? ''}
              maxLength={280}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="battleFormat" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Formato</label>
              <select id="battleFormat" name="battleFormat" defaultValue={team.battleFormat} className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50">
                <option value="SINGLES">Singles</option>
                <option value="DOUBLES">Doubles</option>
                <option value="VGC">VGC</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label htmlFor="generation" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Geração</label>
              <select id="generation" name="generation" defaultValue={team.generation} className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50">
                {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((g) => <option key={g} value={g}>Gen {g}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="formatId" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Tier</label>
              <select id="formatId" name="formatId" defaultValue={team.formatId ?? ''} className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50">
                <option value="">Sem tier</option>
                {formats.map((f: (typeof formats)[number]) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <Button type="submit" size="sm" className="w-fit">Salvar alterações</Button>
        </form>
      </details>

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
