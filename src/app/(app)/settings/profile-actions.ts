'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toId } from '@/lib/team-builder/showdown-format';

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return session!.user;
}

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(32),
  bio: z.string().trim().max(280).default(''),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  profileThemeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  favoritePokemonName: z.string().trim().optional().or(z.literal('')),
  gamesPlayed: z.string().optional(),
});

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function updateFullProfile(
  _prev: ProfileResult | null,
  formData: FormData
): Promise<ProfileResult> {
  const me = await requireUser();

  const parsed = profileSchema.safeParse({
    displayName: formData.get('displayName'),
    bio: formData.get('bio') ?? '',
    bannerUrl: formData.get('bannerUrl') ?? '',
    profileThemeColor: formData.get('profileThemeColor') ?? '',
    favoritePokemonName: formData.get('favoritePokemonName') ?? '',
    gamesPlayed: formData.get('gamesPlayed') ?? '',
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const { displayName, bio, bannerUrl, profileThemeColor, favoritePokemonName, gamesPlayed } = parsed.data;

  let favoritePokemonId: string | null = null;
  if (favoritePokemonName) {
    const species = await prisma.pokemonSpecies.findUnique({
      where: { showdownId: toId(favoritePokemonName) },
    });
    if (!species) return { ok: false, error: `"${favoritePokemonName}" não encontrado — rode sync:showdown.` };
    favoritePokemonId = species.id;
  }

  const parsedGames = gamesPlayed
    ? (gamesPlayed.split(',').map((g: string) => g.trim()).filter(Boolean) as string[])
    : [];

  await prisma.user.update({
    where: { id: me.id },
    data: {
      displayName,
      bio,
      bannerUrl: bannerUrl || null,
      profileThemeColor: profileThemeColor || null,
      favoritePokemonId: favoritePokemonName ? favoritePokemonId : null,
      gamesPlayed: parsedGames.length > 0
  ? (parsedGames as Prisma.InputJsonValue)
  : Prisma.JsonNull,
    },
  });

  revalidatePath(`/profile/${me.username}`);
  revalidatePath('/settings/perfil');
  return { ok: true };
}
