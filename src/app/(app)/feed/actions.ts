'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return session!.user;
}

const postSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sharedTeamId: z.string().trim().optional(),
});

export async function createPost(formData: FormData) {
  const me = await requireUser();
  const parsed = postSchema.parse({
    content: formData.get('content'),
    imageUrl: formData.get('imageUrl') ?? '',
    sharedTeamId: formData.get('sharedTeamId') || undefined,
  });

  if (parsed.sharedTeamId) {
    const team = await prisma.team.findUnique({ where: { id: parsed.sharedTeamId }, select: { ownerId: true } });
    if (!team || team.ownerId !== me.id) throw new Error('Você só pode compartilhar times seus.');
  }

  await prisma.userPost.create({
    data: {
      authorId: me.id,
      content: parsed.content,
      imageUrl: parsed.imageUrl || null,
      sharedTeamId: parsed.sharedTeamId || null,
    },
  });

  revalidatePath('/feed');
  revalidatePath(`/profile/${me.username}`);
}

export async function deletePost(postId: string) {
  const me = await requireUser();
  const post = await prisma.userPost.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== me.id) throw new Error('Post não encontrado.');
  await prisma.userPost.delete({ where: { id: postId } });
  revalidatePath('/feed');
  revalidatePath(`/profile/${me.username}`);
}

export async function togglePostLike(postId: string) {
  const me = await requireUser();
  const existing = await prisma.postLike.findUnique({ where: { userId_postId: { userId: me.id, postId } } });

  if (existing) {
    await prisma.$transaction([
      prisma.postLike.delete({ where: { id: existing.id } }),
      prisma.userPost.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.postLike.create({ data: { userId: me.id, postId } }),
      prisma.userPost.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
    ]);
  }

  revalidatePath('/feed');
}

const commentSchema = z.object({ content: z.string().trim().min(1).max(1000) });

export async function addPostComment(postId: string, formData: FormData) {
  const me = await requireUser();
  const parsed = commentSchema.parse({ content: formData.get('content') });

  await prisma.$transaction([
    prisma.postComment.create({ data: { postId, authorId: me.id, content: parsed.content } }),
    prisma.userPost.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
  ]);

  revalidatePath('/feed');
}
