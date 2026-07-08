'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseShowdownTeamText, toId } from '@/lib/team-builder/showdown-format';
import { NATURES } from '@/lib/team-builder/constants';

async function assertOwnership(teamId: string) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== session!.user.id) {
    throw new Error('Time não encontrado.');
  }
  return team;
}

export async function deleteSlot(teamId: string, position: number) {
  await assertOwnership(teamId);
  await prisma.teamSlot.deleteMany({ where: { teamId, position } });
  revalidatePath(`/team-builder/${teamId}`);
}

export interface ImportResult {
  ok: boolean;
  warnings: string[];
  importedCount: number;
}

/** Importa um time colado no formato Showdown. Resolve nomes de
 *  especie/item/ability/move para os IDs do nosso cache local — qualquer
 *  nome que não exista no banco (ainda não sincronizado) gera um warning e o
 *  campo correspondente fica vazio, em vez de falhar a importação inteira. */
export async function importShowdownTeam(teamId: string, text: string): Promise<ImportResult> {
  await assertOwnership(teamId);
  const warnings: string[] = [];

  let parsedSlots;
  try {
    parsedSlots = parseShowdownTeamText(text).slice(0, 6);
  } catch (err) {
    return { ok: false, warnings: [String(err instanceof Error ? err.message : err)], importedCount: 0 };
  }

  if (parsedSlots.length === 0) {
    return { ok: false, warnings: ['Nenhum Pokémon reconhecido no texto colado.'], importedCount: 0 };
  }

  await prisma.teamSlot.deleteMany({ where: { teamId } });

  let imported = 0;
  for (let i = 0; i < parsedSlots.length; i++) {
    const parsed = parsedSlots[i]!;
    const position = i + 1;

    const species = await prisma.pokemonSpecies.findUnique({ where: { showdownId: parsed.speciesSlug } });
    if (!species) {
      warnings.push(`"${parsed.speciesName}" não foi encontrado no banco (rode npm run sync:showdown).`);
      continue;
    }

    const ability = parsed.abilityName
      ? await prisma.ability.findUnique({ where: { showdownId: toId(parsed.abilityName) } })
      : null;
    if (parsed.abilityName && !ability) {
      warnings.push(`Habilidade "${parsed.abilityName}" não encontrada para ${parsed.speciesName}.`);
    }

    const item = parsed.itemName ? await prisma.item.findUnique({ where: { showdownId: toId(parsed.itemName) } }) : null;
    if (parsed.itemName && !item) {
      warnings.push(`Item "${parsed.itemName}" não encontrado.`);
    }

    const nature = NATURES.includes(parsed.nature as (typeof NATURES)[number]) ? parsed.nature : 'Hardy';

    const slot = await prisma.teamSlot.create({
      data: {
        teamId,
        speciesId: species.id,
        position,
        nickname: parsed.nickname,
        gender: parsed.gender,
        level: parsed.level,
        shiny: parsed.shiny,
        abilityId: ability?.id ?? null,
        itemId: item?.id ?? null,
        natureName: nature,
        teraType: parsed.teraType as never,
        ivHp: parsed.ivs.hp,
        ivAtk: parsed.ivs.atk,
        ivDef: parsed.ivs.def,
        ivSpa: parsed.ivs.spa,
        ivSpd: parsed.ivs.spd,
        ivSpe: parsed.ivs.spe,
        evHp: parsed.evs.hp,
        evAtk: parsed.evs.atk,
        evDef: parsed.evs.def,
        evSpa: parsed.evs.spa,
        evSpd: parsed.evs.spd,
        evSpe: parsed.evs.spe,
      },
    });

    let moveSlot = 1;
    for (const moveName of parsed.moveNames) {
      const move = await prisma.move.findUnique({ where: { showdownId: toId(moveName) } });
      if (!move) {
        warnings.push(`Golpe "${moveName}" não encontrado para ${parsed.speciesName}.`);
        continue;
      }
      await prisma.teamSlotMove.create({ data: { teamSlotId: slot.id, moveId: move.id, slot: moveSlot } });
      moveSlot++;
    }

    imported++;
  }

  revalidatePath(`/team-builder/${teamId}`);
  return { ok: true, warnings, importedCount: imported };
}
