'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toId } from '@/lib/team-builder/showdown-format';

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return session!.user;
}

const createLeagueSchema = z.object({
  name: z.string().trim().min(1).max(60),
  formatId: z.string().min(1),
  rosterSize: z.coerce.number().int().min(1).max(20).default(11),
});

export async function createLeague(formData: FormData) {
  const me = await requireUser();
  const parsed = createLeagueSchema.parse({
    name: formData.get('name'),
    formatId: formData.get('formatId'),
    rosterSize: formData.get('rosterSize'),
  });

  const league = await prisma.draftLeague.create({
    data: {
      ownerId: me.id,
      formatId: parsed.formatId,
      name: parsed.name,
      ruleset: { rosterSize: parsed.rosterSize } as Prisma.InputJsonValue,
    },
  });

  redirect(`/draft-league/${league.id}`);
}

export async function addLeagueTeam(leagueId: string, formData: FormData) {
  const me = await requireUser();
  const league = await prisma.draftLeague.findUnique({ where: { id: leagueId } });
  if (!league || league.ownerId !== me.id) throw new Error('Apenas o organizador pode adicionar participantes.');

  const username = String(formData.get('username') ?? '').trim().replace(/^@/, '');
  const teamName = String(formData.get('teamName') ?? '').trim() || `Time de ${username}`;

  const participant = await prisma.user.findUnique({ where: { username } });
  if (!participant) throw new Error(`Usuário "${username}" não encontrado.`);

  const existing = await prisma.draftLeagueTeam.findUnique({
    where: { leagueId_ownerId: { leagueId, ownerId: participant.id } },
  });
  if (existing) throw new Error('Este usuário já está nesta liga.');

  await prisma.draftLeagueTeam.create({ data: { leagueId, ownerId: participant.id, name: teamName } });
  revalidatePath(`/draft-league/${leagueId}`);
}

export async function setLeagueStatus(leagueId: string, status: string) {
  const me = await requireUser();
  const league = await prisma.draftLeague.findUnique({ where: { id: leagueId } });
  if (!league || league.ownerId !== me.id) throw new Error('Apenas o organizador pode mudar o status.');

  await prisma.draftLeague.update({ where: { id: leagueId }, data: { status: status as never } });
  revalidatePath(`/draft-league/${leagueId}`);
}

export async function makePick(leagueId: string, formData: FormData) {
  const me = await requireUser();

  const league = await prisma.draftLeague.findUnique({ where: { id: leagueId } });
  if (!league) throw new Error('Liga não encontrada.');

  const leagueTeamId = String(formData.get('leagueTeamId') ?? '');
  const speciesName = String(formData.get('species') ?? '').trim();
  const isBan = formData.get('isBan') === 'true';

  const leagueTeam = await prisma.draftLeagueTeam.findUnique({ where: { id: leagueTeamId } });
  if (!leagueTeam || leagueTeam.leagueId !== leagueId) throw new Error('Time da liga não encontrado.');
  if (leagueTeam.ownerId !== me.id && league.ownerId !== me.id) {
    throw new Error('Você só pode draftar pelo seu próprio time (ou ser o organizador da liga).');
  }

  const species = await prisma.pokemonSpecies.findUnique({ where: { showdownId: toId(speciesName) } });
  if (!species) throw new Error(`"${speciesName}" não foi encontrado — rode npm run sync:showdown.`);

  const alreadyTaken = await prisma.draftPick.findFirst({
    where: { speciesId: species.id, leagueTeam: { leagueId } },
  });
  if (alreadyTaken) throw new Error(`${species.name} já foi escolhido ou banido nesta liga.`);

  if (!isBan) {
    const ruleset = league.ruleset as { rosterSize?: number } | null;
    const rosterSize = ruleset?.rosterSize ?? 11;
    const currentRosterCount = await prisma.draftPick.count({ where: { leagueTeamId, isBan: false } });
    if (currentRosterCount >= rosterSize) {
      throw new Error(`Elenco já está completo (${rosterSize} Pokémon).`);
    }
  }

  const totalPicks = await prisma.draftPick.count({ where: { leagueTeam: { leagueId } } });
  const teamCount = await prisma.draftLeagueTeam.count({ where: { leagueId } });

  await prisma.draftPick.create({
    data: {
      leagueTeamId,
      speciesId: species.id,
      isBan,
      pickNumber: totalPicks + 1,
      round: Math.ceil((totalPicks + 1) / Math.max(1, teamCount)),
    },
  });

  revalidatePath(`/draft-league/${leagueId}`);
}
