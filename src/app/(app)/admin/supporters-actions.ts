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

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export async function createSupporter(formData: FormData) {
  await requireAdmin();

  const name = str(formData, 'name');
  if (!name) throw new Error('Nome é obrigatório.');

  await prisma.supporter.create({
    data: {
      name,
      role: str(formData, 'role'),
      photoUrl: str(formData, 'photoUrl'),
      link: str(formData, 'link'),
      message: str(formData, 'message'),
      tier: (str(formData, 'tier') as 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND') ?? 'BRONZE',
      platform: (str(formData, 'platform') as 'MANUAL' | 'PIX' | 'APOIA_SE' | 'KOFI' | 'PATREON') ?? 'MANUAL',
      isActive: true,
    },
  });

  revalidatePath('/admin/supporters');
  revalidatePath('/apoiadores');
}

export async function updateSupporter(supporterId: string, formData: FormData) {
  await requireAdmin();

  const name = str(formData, 'name');
  if (!name) throw new Error('Nome é obrigatório.');

  await prisma.supporter.update({
    where: { id: supporterId },
    data: {
      name,
      role: str(formData, 'role'),
      photoUrl: str(formData, 'photoUrl'),
      link: str(formData, 'link'),
      message: str(formData, 'message'),
      tier: (str(formData, 'tier') as 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND') ?? 'BRONZE',
      platform: (str(formData, 'platform') as 'MANUAL' | 'PIX' | 'APOIA_SE' | 'KOFI' | 'PATREON') ?? 'MANUAL',
    },
  });

  revalidatePath('/admin/supporters');
  revalidatePath('/apoiadores');
}

/** Editar um dos 3 cards fixos de plataforma (Pix/Ko-fi/Patreon) — só link,
 *  logo e mensagem; nome/tier/plataforma ficam travados (ver getOrCreatePlatformCards). */
export async function updatePlatformLink(supporterId: string, formData: FormData) {
  await requireAdmin();

  await prisma.supporter.update({
    where: { id: supporterId, isPlatformCard: true },
    data: {
      link: str(formData, 'link'),
      photoUrl: str(formData, 'photoUrl'),
      message: str(formData, 'message'),
    },
  });

  revalidatePath('/admin/supporters');
  revalidatePath('/apoiadores');
}

export async function toggleSupporterActive(supporterId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.supporter.update({ where: { id: supporterId }, data: { isActive } });
  revalidatePath('/admin/supporters');
  revalidatePath('/apoiadores');
}

export async function deleteSupporter(supporterId: string) {
  await requireAdmin();
  await prisma.supporter.delete({ where: { id: supporterId } });
  revalidatePath('/admin/supporters');
  revalidatePath('/apoiadores');
}
