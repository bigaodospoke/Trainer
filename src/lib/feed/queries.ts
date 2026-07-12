import { prisma } from '@/lib/prisma';

const POST_INCLUDE = {
  author: { select: { username: true, displayName: true, avatarUrl: true } },
  sharedTeam: {
    select: {
      id: true, name: true, battleFormat: true, generation: true, isPublic: true,
      slots: { select: { species: { select: { name: true, spriteUrl: true } } }, orderBy: { position: 'asc' as const } },
      owner: { select: { username: true } },
    },
  },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
  },
} as const;

/** Feed = posts proprios + de quem eu sigo, mais recentes primeiro. Simples
 *  (sem ranking por engajamento) de proposito — e o mesmo modelo mental do
 *  "seguindo" que o resto do site ja usa (ver ActivityEvent no dashboard). */
export async function getFeedPosts(userId: string, limit = 30) {
  const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  const authorIds = [userId, ...following.map((f: { followingId: string }) => f.followingId)];

  return prisma.userPost.findMany({
    where: { authorId: { in: authorIds }, isHidden: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: POST_INCLUDE,
  });
}

export async function getPostsByAuthorIds(authorIds: string[], limit = 30) {
  return prisma.userPost.findMany({
    where: { authorId: { in: authorIds }, isHidden: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: POST_INCLUDE,
  });
}

export async function getMyLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const likes = await prisma.postLike.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(likes.map((l: { postId: string }) => l.postId));
}

/** "Times em destaque" pro feed — reusa os mesmos criterios de popularidade
 *  da Biblioteca (likesCount), sem duplicar a query la. */
export async function getFeaturedTeams(limit = 6) {
  return prisma.team.findMany({
    where: { isPublic: true },
    orderBy: { likesCount: 'desc' },
    take: limit,
    include: {
      owner: { select: { username: true } },
      slots: { select: { species: { select: { name: true, spriteUrl: true } } }, orderBy: { position: 'asc' } },
    },
  });
}
