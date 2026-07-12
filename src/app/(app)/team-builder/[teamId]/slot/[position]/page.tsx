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
import { NATURES, TERA_TYPES } from '@/lib/team-builder/constants';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EvInputs } from '@/components/team-builder/ev-inputs';
import { IvInputs } from '@/components/team-builder/iv-inputs';
import { SearchableSelect } from '@/components/team-builder/searchable-select';
import { Combobox } from '@/components/team-builder/combobox';
import { PokemonIcon, ItemIcon } from '@/components/team-builder/sprite-icon';
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
        <SetEditor teamId={teamId} position={position} generation={team.generation} slotId={slot!.id} />
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
  slotId,
}: {
  teamId: string;
  position: number;
  generation: number;
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
          <div>
            <label htmlFor="level" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
              Level
            </label>
            <Input id="level" name="level" type="number" min={1} max={100} defaultValue={slot.level} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="abilityId" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
              Ability
            </label>
            <SearchableSelect
              name="abilityId"
              defaultValue={slot.abilityId ?? ''}
              allowEmpty
              placeholder="Escolher ability..."
              options={species.abilities.map((pa: (typeof species.abilities)[number]) => ({
                value: pa.abilityId,
                label: pa.ability.name,
                hint: pa.isHidden ? 'Hidden' : undefined,
              }))}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Item</label>
            <Combobox
              name="itemName"
              options={itemOptions}
              defaultValue={slot.item?.name ?? ''}
              placeholder="ex.: Choice Scarf"
              allowEmpty
              iconKind="item"
              previewSize={36}
            />
          </div>
          <div>
            <label htmlFor="natureName" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
              Nature
            </label>
            <SearchableSelect
              name="natureName"
              defaultValue={slot.natureName}
              placeholder="Escolher nature..."
              options={NATURES.map((n) => ({ value: n, label: n }))}
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label htmlFor="teraType" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
            Tera Type
          </label>
          <SearchableSelect
            name="teraType"
            defaultValue={slot.teraType ?? ''}
            allowEmpty
            placeholder="Escolher tera type..."
            options={TERA_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>

        <EvInputs
          defaults={{ hp: slot.evHp, atk: slot.evAtk, def: slot.evDef, spa: slot.evSpa, spd: slot.evSpd, spe: slot.evSpe }}
        />

        <IvInputs
          defaults={{ hp: slot.ivHp, atk: slot.ivAtk, def: slot.ivDef, spa: slot.ivSpa, spd: slot.ivSpd, spe: slot.ivSpe }}
        />

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-dim">Golpes</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <Combobox
                key={n}
                name={`move${n}`}
                iconKind="move"
                options={moveOptions}
                defaultValue={moveAt(n)}
                placeholder="ex.: Dragon Claw"
                allowEmpty
              />
            ))}
          </div>
          {learnableMoves.length === 0 && (
            <p className="mt-2 text-xs text-warning">
              Nenhum golpe encontrado para esta espécie/geração — rode npm run sync:showdown.
            </p>
          )}
        </div>

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
