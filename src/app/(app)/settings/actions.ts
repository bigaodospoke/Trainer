'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(32),
  bio: z.string().trim().max(280).optional().default(''),
});

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(
  _prevState: UpdateProfileResult | null,
  formData: FormData
): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Nao autenticado.' };

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: parsed.data.displayName, bio: parsed.data.bio },
  });

  revalidatePath(`/profile/${session.user.username}`);
  revalidatePath('/settings');

  return { ok: true };
}
