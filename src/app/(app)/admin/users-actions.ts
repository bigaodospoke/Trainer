'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  if (session.user.role !== 'ADMIN') throw new Error('Apenas administradores podem fazer isso.');
}

export async function addUserTag(userId: string, formData: FormData) {
  await requireAdmin();
  const tag = String(formData.get('tag') ?? '').trim().slice(0, 24);
  if (!tag) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tags: true, username: true } });
  if (!user || user.tags.includes(tag)) return;

  await prisma.user.update({ where: { id: userId }, data: { tags: { push: tag } } });
  revalidatePath('/admin/users');
  revalidatePath(`/profile/${user.username}`);
}

export async function removeUserTag(userId: string, tag: string) {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tags: true, username: true } });
  if (!user) return;

  await prisma.user.update({ where: { id: userId }, data: { tags: user.tags.filter((t) => t !== tag) } });
  revalidatePath('/admin/users');
  revalidatePath(`/profile/${user.username}`);
}
