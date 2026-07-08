import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 24;

export interface LibraryFilters {
  q?: string;
  battleFormat?: string;
  generation?: number;
  sort?: 'recent' | 'liked';
  page?: number;
}

export async function searchPublicTeams(filters: LibraryFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const where = {
    isPublic: true,
    AND: [
      filters.q ? { name: { contains: filters.q, mode: 'insensitive' as const } } : {},
      filters.battleFormat ? { battleFormat: filters.battleFormat as never } : {},
      filters.generation ? { generation: filters.generation } : {},
    ],
  };

  const orderBy = filters.sort === 'liked' ? { likesCount: 'desc' as const } : { updatedAt: 'desc' as const };

  const [items, total] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        owner: { select: { username: true, displayName: true, avatarUrl: true } },
        format: true,
        slots: { include: { species: true }, orderBy: { position: 'asc' } },
      },
    }),
    prisma.team.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getPublicTeamDetail(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      format: true,
      slots: {
        orderBy: { position: 'asc' },
        include: { species: true, item: true, ability: true, moves: { include: { move: true }, orderBy: { slot: 'asc' } } },
      },
      comments: {
        where: { isHidden: false, parentId: null },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
      },
    },
  });
}

export async function hasUserLiked(userId: string, teamId: string) {
  const like = await prisma.like.findUnique({ where: { userId_teamId: { userId, teamId } } });
  return !!like;
}
