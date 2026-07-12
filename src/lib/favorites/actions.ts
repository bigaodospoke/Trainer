'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type FavoriteTargetType = 'POKEMON' | 'TEAM' | 'STRATEGY' | 'POST';

/** Cria ou remove o favorito (toggle) e revalida a pagina de origem. */
export async function toggleFavorite(targetType: FavoriteTargetType, targetId: string, revalidate?: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Não autenticado');

  const existing = await prisma.favorite.findUnique({
    where: { userId_targetType_targetId: { userId: session.user.id, targetType, targetId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: session.user.id, targetType, targetId } });
  }

  if (revalidate) revalidatePath(revalidate);
  revalidatePath('/favoritos');
  return { favorited: !existing };
}

export async function isFavorited(targetType: FavoriteTargetType, targetId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const existing = await prisma.favorite.findUnique({
    where: { userId_targetType_targetId: { userId: session.user.id, targetType, targetId } },
  });
  return Boolean(existing);
}

interface FavoriteRow {
  targetType: string;
  targetId: string;
}

export async function getFavoritesForUser(userId: string) {
  const favorites: FavoriteRow[] = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const pokemonIds = favorites.filter((f) => f.targetType === 'POKEMON').map((f) => f.targetId);
  const teamIds = favorites.filter((f) => f.targetType === 'TEAM').map((f) => f.targetId);

  const [species, teams] = await Promise.all([
    pokemonIds.length
      ? prisma.pokemonSpecies.findMany({
          where: { id: { in: pokemonIds } },
          select: { id: true, slug: true, name: true, types: true, iconSheetUrl: true, iconTop: true, iconLeft: true },
        })
      : Promise.resolve([]),
    teamIds.length
      ? prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true, format: { select: { name: true } }, owner: { select: { username: true } } },
        })
      : Promise.resolve([]),
  ]);

  return { species, teams, strategyCount: favorites.filter((f) => f.targetType === 'STRATEGY').length };
}
