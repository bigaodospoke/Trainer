'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function toggleLike(teamId: string) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true, isPublic: true, name: true } });
  if (!team || !team.isPublic) throw new Error('Time não encontrado.');

  const existing = await prisma.like.findUnique({
    where: { userId_teamId: { userId: session!.user.id, teamId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.team.update({ where: { id: teamId }, data: { likesCount: { decrement: 1 } } }),
      prisma.user.update({ where: { id: team.ownerId }, data: { likesReceived: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.like.create({ data: { userId: session!.user.id, teamId } }),
      prisma.team.update({ where: { id: teamId }, data: { likesCount: { increment: 1 } } }),
      prisma.user.update({ where: { id: team.ownerId }, data: { likesReceived: { increment: 1 } } }),
      prisma.activityEvent.create({
        data: { userId: session!.user.id, type: 'TEAM_LIKED', payload: { teamId, teamName: team.name } },
      }),
    ]);
  }

  revalidatePath(`/library/${teamId}`);
  revalidatePath('/library');
}

const commentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export async function postComment(teamId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { isPublic: true, name: true } });
  if (!team || !team.isPublic) throw new Error('Time não encontrado.');

  const parsed = commentSchema.parse({ content: formData.get('content') });

  await prisma.$transaction([
    prisma.comment.create({ data: { teamId, authorId: session!.user.id, content: parsed.content } }),
    prisma.team.update({ where: { id: teamId }, data: { commentsCount: { increment: 1 } } }),
    prisma.activityEvent.create({
      data: { userId: session!.user.id, type: 'COMMENT_POSTED', payload: { teamId, teamName: team.name } },
    }),
  ]);

  revalidatePath(`/library/${teamId}`);
}

export async function registerDownload(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { isPublic: true, ownerId: true, partnerId: true } });
  if (!team || (!team.isPublic && !team.partnerId)) return;

  await prisma.$transaction([
    prisma.team.update({ where: { id: teamId }, data: { downloadsCount: { increment: 1 } } }),
    prisma.user.update({ where: { id: team.ownerId }, data: { downloadsCount: { increment: 1 } } }),
  ]);

  revalidatePath(`/library/${teamId}`);
}
