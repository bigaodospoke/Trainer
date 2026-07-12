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

export async function approvePartner(partnerId: string) {
  await requireAdmin();
  await prisma.partnerServer.update({
    where: { id: partnerId },
    data: { status: 'APPROVED', approvedAt: new Date(), rejectionReason: null },
  });
  revalidatePath('/admin/partners');
  revalidatePath('/partners');
}

export async function rejectPartner(partnerId: string, formData: FormData) {
  await requireAdmin();
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 300) || null;
  await prisma.partnerServer.update({ where: { id: partnerId }, data: { status: 'REJECTED', rejectionReason: reason } });
  revalidatePath('/admin/partners');
  revalidatePath('/partners');
}

export async function suspendPartner(partnerId: string) {
  await requireAdmin();
  await prisma.partnerServer.update({ where: { id: partnerId }, data: { status: 'SUSPENDED' } });
  revalidatePath('/admin/partners');
  revalidatePath('/partners');
}

export async function deletePartner(partnerId: string) {
  await requireAdmin();
  await prisma.partnerServer.delete({ where: { id: partnerId } });
  revalidatePath('/admin/partners');
  revalidatePath('/partners');
}

export async function setPartnerTier(partnerId: string, formData: FormData) {
  await requireAdmin();
  const tier = String(formData.get('tier') ?? '');
  await prisma.partnerServer.update({ where: { id: partnerId }, data: { tier: tier as never } });
  revalidatePath('/admin/partners');
  revalidatePath('/partners');
}
