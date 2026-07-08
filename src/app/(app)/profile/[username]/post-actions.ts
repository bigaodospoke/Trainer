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
});

export async function createPost(formData: FormData) {
  const me = await requireUser();
  const parsed = postSchema.parse({
    content: formData.get('content'),
    imageUrl: formData.get('imageUrl') ?? '',
  });

  await prisma.userPost.create({
    data: {
      authorId: me.id,
      content: parsed.content,
      imageUrl: parsed.imageUrl || null,
    },
  });

  revalidatePath(`/profile/${me.username}`);
}

export async function deletePost(postId: string) {
  const me = await requireUser();
  const post = await prisma.userPost.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== me.id) throw new Error('Post não encontrado.');
  await prisma.userPost.delete({ where: { id: postId } });
  revalidatePath(`/profile/${me.username}`);
}
