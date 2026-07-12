import { prisma } from '@/lib/prisma';

/** True se os dois usuarios tem uma amizade com status ACCEPTED, em
 *  qualquer direcao (requester/addressee). Usado tanto pra liberar acesso a
 *  times com visibility=FRIENDS quanto pra decidir quem pode mandar
 *  mensagem. */
export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return true;
  const friend = await prisma.friend.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
    select: { id: true },
  });
  return !!friend;
}

export async function getFriendsList(userId: string) {
  const friendships = await prisma.friend.findMany({
    where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: { id: true, username: true, displayName: true, avatarUrl: true, lastActiveAt: true } },
      addressee: { select: { id: true, username: true, displayName: true, avatarUrl: true, lastActiveAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return friendships.map((f) => ({
    friendshipId: f.id,
    user: f.requesterId === userId ? f.addressee : f.requester,
  }));
}

export async function getPendingRequests(userId: string) {
  const [received, sent] = await Promise.all([
    prisma.friend.findMany({
      where: { addresseeId: userId, status: 'PENDING' },
      include: { requester: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friend.findMany({
      where: { requesterId: userId, status: 'PENDING' },
      include: { addressee: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { received, sent };
}

/** online: ativo nos ultimos 2min · ausente: nos ultimos 15min · offline: caso contrario/nunca. */
export function presenceStatus(lastActiveAt: Date | null): 'online' | 'away' | 'offline' {
  if (!lastActiveAt) return 'offline';
  const diffMs = Date.now() - lastActiveAt.getTime();
  if (diffMs < 2 * 60 * 1000) return 'online';
  if (diffMs < 15 * 60 * 1000) return 'away';
  return 'offline';
}

export async function searchUsers(query: string, excludeUserId: string, limit = 20) {
  if (!query.trim()) return [];
  return prisma.user.findMany({
    where: {
      username: { contains: query.trim(), mode: 'insensitive' },
      id: { not: excludeUserId },
      isBanned: false,
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true, lastActiveAt: true },
    take: limit,
  });
}
