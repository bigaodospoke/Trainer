'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  if (session.user.role !== 'ADMIN') throw new Error('Apenas administradores podem fazer isso.');
  return session.user;
}

export async function banUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
  revalidatePath('/admin');
}

export async function resolveReport(reportId: string) {
  await requireAdmin();
  await prisma.report.update({ where: { id: reportId }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
  revalidatePath('/admin');
}

export async function dismissReport(reportId: string) {
  await requireAdmin();
  await prisma.report.update({ where: { id: reportId }, data: { status: 'DISMISSED', resolvedAt: new Date() } });
  revalidatePath('/admin');
}
