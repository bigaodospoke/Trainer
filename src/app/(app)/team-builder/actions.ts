'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(60),
  battleFormat: z.enum(['SINGLES', 'DOUBLES', 'VGC', 'CUSTOM']),
  generation: z.coerce.number().int().min(1).max(9),
  formatId: z.string().trim().optional(),
});

export async function createTeam(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const parsed = createTeamSchema.safeParse({
    name: formData.get('name'),
    battleFormat: formData.get('battleFormat'),
    generation: formData.get('generation'),
    formatId: formData.get('formatId') || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  const team = await prisma.team.create({
    data: {
      ownerId: session!.user.id,
      name: parsed.data.name,
      battleFormat: parsed.data.battleFormat,
      generation: parsed.data.generation,
      formatId: parsed.data.formatId || null,
    },
  });

  await prisma.user.update({
    where: { id: session!.user.id },
    data: { teamsCount: { increment: 1 } },
  });

  revalidatePath('/team-builder');
  redirect(`/team-builder/${team.id}`);
}

const updateTeamInfoSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(280).optional().default(''),
  battleFormat: z.enum(['SINGLES', 'DOUBLES', 'VGC', 'CUSTOM']),
  generation: z.coerce.number().int().min(1).max(9),
  formatId: z.string().trim().optional(),
});

/** Edita nome/descricao/formato do time sem apagar e recriar — os Pokemon
 *  em si continuam editaveis normalmente pelos slots individuais. */
export async function updateTeamInfo(teamId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== session!.user.id) {
    throw new Error('Time não encontrado.');
  }

  const parsed = updateTeamInfoSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    battleFormat: formData.get('battleFormat'),
    generation: formData.get('generation'),
    formatId: formData.get('formatId') || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      battleFormat: parsed.data.battleFormat,
      generation: parsed.data.generation,
      formatId: parsed.data.formatId || null,
    },
  });

  revalidatePath(`/team-builder/${teamId}`);
}

export async function deleteTeam(teamId: string) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== session!.user.id) {
    throw new Error('Time não encontrado.');
  }

  await prisma.team.delete({ where: { id: teamId } });
  await prisma.user.update({
    where: { id: session!.user.id },
    data: { teamsCount: { decrement: 1 } },
  });

  revalidatePath('/team-builder');
  redirect('/team-builder');
}

/** PUBLIC mantem isPublic=true em sincronia (todas as queries existentes que
 *  filtram por isPublic continuam corretas); FRIENDS e PRIVATE mantem
 *  isPublic=false — FRIENDS so libera acesso extra explicitamente checado
 *  em library/[teamId] e no compartilhamento via chat. */
export async function setTeamVisibility(teamId: string, visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE') {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== session!.user.id) {
    throw new Error('Time não encontrado.');
  }

  await prisma.team.update({
    where: { id: teamId },
    data: { visibility, isPublic: visibility === 'PUBLIC' },
  });

  if (visibility === 'PUBLIC' && !team.isPublic) {
    await prisma.activityEvent.create({
      data: { userId: session!.user.id, type: 'TEAM_PUBLISHED', payload: { teamId, teamName: team.name } },
    });
  }

  revalidatePath(`/team-builder/${teamId}`);
}
