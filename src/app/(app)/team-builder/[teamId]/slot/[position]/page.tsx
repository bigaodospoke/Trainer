import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAllSpeciesOptions,
  getAllItemOptions,
  getSpeciesById,
  getLearnableMoves,
} from '@/lib/team-builder/queries';
import { TERA_TYPES } from '@/lib/team-builder/constants';
import { calculateStat } from '@/lib/team-builder/stat-calc';
import { getAvailableMonths, getSpeciesBuildComponents } from '@/lib/meta-analyzer/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatsEditor } from '@/components/team-builder/stats-editor';
import { Combobox } from '@/components/team-builder/combobox';
import { CompetitiveFields } from '@/components/team-builder/competitive-fields';
import { SpeciesPreview } from '@/components/team-builder/species-preview';
import { setSlotSpecies, saveSlotSet } from './actions';

interface SlotPageProps {
  params: Promise<{ teamId: string; position: string }>;
  searchParams: Promise<{ change?: string }>;
}

export default async function SlotPage({ params, searchParams }: SlotPageProps) {
  const { teamId, position: positionStr } = await params;
  const { change } = await searchParams;
  const position = Number(positionStr);
  const session = await auth();

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();
  if (team.ownerId !== session!.user.id) redirect('/team-builder');

  const slot = await prisma.teamSlot.findUnique({
    where: { teamId_position: { teamId, position } },
    include: { moves: true },
  });

  const showSpeciesPicker = !slot || change === '1';

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/team-builder/${teamId}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao time
      </Link>

      {showSpeciesPicker ? (
        <SpeciesPicker teamId={teamId} position={position} />
      ) : (
        <SetEditor
          teamId={teamId}
          position={position}
          generation={team.generation}
          formatId={team.formatId}
          slotId={slot!.id}
        />
      )}
    </div>
  );
}

async function SpeciesPicker({ teamId, position }: { teamId: string; position: number }) {
  const species = await getAllSpeciesOptions();
  const action = setSlotSpecies.bind(null, teamId, position);

  const options = species.map((s: (typeof species)[number]) => ({
    value: s.name,
    icon: { iconSheetUrl: s.iconSheetUrl, iconTop: s.iconTop, iconLeft: s.iconLeft },
  }));

  return (
    <GlassCard padding="lg" className="max-w-md">
      <h1 className="mb-4 font-display text-xl font-semibold text-ink-primary">Escolher Pokémon</h1>
      <form action={action}>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Espécie</label>
        <Combobox
          name="species"
          options={options}
          placeholder="ex.: Landorus-Therian"
          required
          autoFocus
          
        />
        <Button type="submit" className="mt-4 w-full">
          Confirmar
        </Button>
      </form>
    </GlassCard>
  );
}

async function SetEditor({
  teamId,
  position,
  generation,
  formatId,
  slotId,
}: {
  teamId: string;
  position: number;
  generation: number;
  formatId: string | null;
  slotId: string;
}) {
  const slot = await prisma.teamSlot.findUnique({
    where: { id: slotId },
    include: { moves: { include: { move: true }, orderBy: { slot: 'asc' } }, item: true },
  });
  if (!slot) notFound();

  const [species, learnableMoves, items] = await Promise.all([
    getSpeciesById(slot.speciesId),
    getLearnableMoves(slot.speciesId, generation),
    getAllItemOptions(),
  ]);
  if (!species) notFound();

  const action = saveSlotSet.bind(null, teamId, position);
  const moveAt = (n: number) => slot.moves.find((m: (typeof slot.moves)[number]) => m.slot === n)?.move.name ?? '';
  const moveOptions = learnableMoves.map((move: (typeof learnableMoves)[number]) => ({
    value: move.name,
    moveType: move.type,
    moveCategory: move.category,
  }));

  const itemOptions = items.map((item: (typeof items)[number]) => ({
    value: item.name,
    icon: { iconSheetUrl: item.iconSheetUrl, iconTop: item.iconTop, iconLeft: item.iconLeft },
  }));

  const abilityOptions = species.abilities.map((pa: (typeof species.abilities)[number]) => ({
    value: pa.abilityId,
    label: pa.ability.name,
    hint: pa.isHidden ? 'Hidden' : undefined,
  }));
  const teraOptions = TERA_TYPES.map((t) => ({ value: t, label: t }));

  // Competitive Snapshot + Componentes mais usados — dados reais do chaos
  // report da Smogon (npm run sync:smogon). Cai pro tier "gen9ou" quando o
  // time nao tem um Format especifico selecionado, mesmo fallback ja usado
  // na Pokedex pra "parceiros comuns".
  const format = formatId
    ? await prisma.format.findUnique({ where: { id: formatId } })
    : await prisma.format.findUnique({ where: { slug: 'gen9ou' } });

  let snapshot = null;
  let buildComponents = null;
  if (format) {
    const months = await getAvailableMonths(format.id);
    const latestMonth = months[0];
    if (latestMonth) {
      const [tierAssignment, usageRow, components] = await Promise.all([
        prisma.tierAssignment.findFirst({ where: { speciesId: species.id, formatId: format.id } }),
        prisma.usageStat.findFirst({ where: { speciesId: species.id, formatId: format.id, month: latestMonth, kind: 'SPECIES' } }),
        getSpeciesBuildComponents(species.id, format.id, latestMonth),
      ]);
      snapshot = {
        tier: tierAssignment?.tier ?? null,
        usagePercent: usageRow?.usagePercent ?? null,
        speedTierLv100: calculateStat('spe', species.baseSpe, 31, 252, 100, 'Hardy'),
      };
      buildComponents = components;
    }
  }

  return (
    <GlassCard padding="lg" className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <SpeciesPreview
          name={species.name}
          types={species.types}
          normalSpriteUrl={species.spriteAnimatedUrl ?? ''}
          shinySpriteUrl={species.spriteShinyAnimatedUrl ?? ''}
          defaultShiny={slot.shiny}
          nationalDex={species.nationalDex}
        />
        <Link
          href={`/team-builder/${teamId}/slot/${position}?change=1`}
          className="text-xs text-ink-muted underline hover:text-ink-primary"
        >
          Trocar espécie
        </Link>
      </div>

      <form action={action} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
            <label htmlFor="nickname" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
              Nickname
            </label>
            <Input id="nickname" name="nickname" defaultValue={slot.nickname ?? ''} maxLength={24} />
          </div>
          <div>
            <label htmlFor="gender" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
              Gênero
            </label>
            <Select id="gender" name="gender" defaultValue={slot.gender ?? ''}>
              <option value="">—</option>
              <option value="M">Macho</option>
              <option value="F">Fêmea</option>
              <option value="N">Sem gênero</option>
            </Select>
          </div>
        </div>

        <CompetitiveFields
          defaultAbilityId={slot.abilityId ?? ''}
          defaultItemName={slot.item?.name ?? ''}
          defaultTeraType={slot.teraType ?? ''}
          defaultMoves={[moveAt(1), moveAt(2), moveAt(3), moveAt(4)]}
          abilityOptions={abilityOptions}
          itemOptions={itemOptions}
          teraOptions={teraOptions}
          moveOptions={moveOptions}
          snapshot={snapshot}
          buildComponents={buildComponents}
        />

        <StatsEditor
          baseStats={{ hp: species.baseHp, atk: species.baseAtk, def: species.baseDef, spa: species.baseSpa, spd: species.baseSpd, spe: species.baseSpe }}
          defaultLevel={slot.level}
          defaultNature={slot.natureName}
          defaultEvs={{ hp: slot.evHp, atk: slot.evAtk, def: slot.evDef, spa: slot.evSpa, spd: slot.evSpd, spe: slot.evSpe }}
          defaultIvs={{ hp: slot.ivHp, atk: slot.ivAtk, def: slot.ivDef, spa: slot.ivSpa, spd: slot.ivSpd, spe: slot.ivSpe }}
        />

        {learnableMoves.length === 0 && (
          <p className="-mt-4 text-xs text-warning">
            Nenhum golpe encontrado para esta espécie/geração — rode npm run sync:showdown.
          </p>
        )}

        <Button type="submit" size="lg">
          Salvar set
        </Button>
      </form>
    </GlassCard>
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
