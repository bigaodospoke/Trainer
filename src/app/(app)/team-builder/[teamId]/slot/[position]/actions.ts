'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toId } from '@/lib/team-builder/showdown-format';

async function assertOwnership(teamId: string) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== session!.user.id) {
    throw new Error('Time não encontrado.');
  }
  return team;
}

/** Passo 1 do editor de slot: define (ou troca) a especie. Ao trocar de
 *  especie, zera ability e golpes (sao especificos da especie anterior). */
export async function setSlotSpecies(teamId: string, position: number, formData: FormData) {
  await assertOwnership(teamId);

  const speciesName = String(formData.get('species') ?? '');
  const species = await prisma.pokemonSpecies.findUnique({ where: { showdownId: toId(speciesName) } });
  if (!species) {
    throw new Error(`"${speciesName}" não foi encontrado. Sincronize com npm run sync:showdown.`);
  }

  const existing = await prisma.teamSlot.findUnique({ where: { teamId_position: { teamId, position } } });

  if (existing && existing.speciesId === species.id) {
    redirect(`/team-builder/${teamId}/slot/${position}`);
  }

  if (existing) {
    await prisma.teamSlotMove.deleteMany({ where: { teamSlotId: existing.id } });
    await prisma.teamSlot.update({
      where: { id: existing.id },
      data: { speciesId: species.id, abilityId: null },
    });
  } else {
    await prisma.teamSlot.create({
      data: {
        teamId,
        position,
        speciesId: species.id,
        natureName: 'Hardy',
      },
    });
  }

  revalidatePath(`/team-builder/${teamId}`);
  redirect(`/team-builder/${teamId}/slot/${position}`);
}

const setFormSchema = z.object({
  nickname: z.string().trim().max(24).optional(),
  gender: z.enum(['M', 'F', 'N', '']).optional(),
  level: z.coerce.number().int().min(1).max(100).default(100),
  shiny: z.coerce.boolean().default(false),
  abilityId: z.string().optional(),
  itemName: z.string().optional(),
  natureName: z.string(),
  teraType: z.string().optional(),
  ivHp: z.coerce.number().int().min(0).max(31),
  ivAtk: z.coerce.number().int().min(0).max(31),
  ivDef: z.coerce.number().int().min(0).max(31),
  ivSpa: z.coerce.number().int().min(0).max(31),
  ivSpd: z.coerce.number().int().min(0).max(31),
  ivSpe: z.coerce.number().int().min(0).max(31),
  evHp: z.coerce.number().int().min(0).max(252),
  evAtk: z.coerce.number().int().min(0).max(252),
  evDef: z.coerce.number().int().min(0).max(252),
  evSpa: z.coerce.number().int().min(0).max(252),
  evSpd: z.coerce.number().int().min(0).max(252),
  evSpe: z.coerce.number().int().min(0).max(252),
  move1: z.string().optional(),
  move2: z.string().optional(),
  move3: z.string().optional(),
  move4: z.string().optional(),
});

export async function saveSlotSet(teamId: string, position: number, formData: FormData) {
  await assertOwnership(teamId);

  const slot = await prisma.teamSlot.findUnique({ where: { teamId_position: { teamId, position } } });
  if (!slot) throw new Error('Slot não encontrado — escolha uma espécie primeiro.');

  const raw = Object.fromEntries(formData.entries());
  const parsed = setFormSchema.parse(raw);

  const item = parsed.itemName ? await prisma.item.findUnique({ where: { showdownId: toId(parsed.itemName) } }) : null;

  await prisma.teamSlot.update({
    where: { id: slot.id },
    data: {
      nickname: parsed.nickname || null,
      gender: parsed.gender || null,
      level: parsed.level,
      shiny: parsed.shiny,
      abilityId: parsed.abilityId || null,
      itemId: item?.id ?? null,
      natureName: parsed.natureName,
      teraType: (parsed.teraType || null) as never,
      ivHp: parsed.ivHp,
      ivAtk: parsed.ivAtk,
      ivDef: parsed.ivDef,
      ivSpa: parsed.ivSpa,
      ivSpd: parsed.ivSpd,
      ivSpe: parsed.ivSpe,
      evHp: parsed.evHp,
      evAtk: parsed.evAtk,
      evDef: parsed.evDef,
      evSpa: parsed.evSpa,
      evSpd: parsed.evSpd,
      evSpe: parsed.evSpe,
    },
  });

  await prisma.teamSlotMove.deleteMany({ where: { teamSlotId: slot.id } });
  const moveIds = [parsed.move1, parsed.move2, parsed.move3, parsed.move4].filter(Boolean) as string[];
  for (let i = 0; i < moveIds.length; i++) {
    await prisma.teamSlotMove.create({ data: { teamSlotId: slot.id, moveId: moveIds[i]!, slot: i + 1 } });
  }

  revalidatePath(`/team-builder/${teamId}`);
  revalidatePath(`/team-builder/${teamId}/slot/${position}`);
  redirect(`/team-builder/${teamId}`);
}
