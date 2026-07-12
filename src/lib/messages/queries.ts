import { prisma } from '@/lib/prisma';

/** Ordena o par de ids sempre da mesma forma — e a base pra Conversation ter
 *  no maximo uma linha por par de usuarios (ver @@unique([userAId, userBId])
 *  no schema). */
function sortPair(userId1: string, userId2: string): [string, string] {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

export async function getOrCreateConversation(userId1: string, userId2: string) {
  const [userAId, userBId] = sortPair(userId1, userId2);
  return prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
}

export async function getConversationsList(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      userA: { select: { id: true, username: true, displayName: true, avatarUrl: true, lastActiveAt: true } },
      userB: { select: { id: true, username: true, displayName: true, avatarUrl: true, lastActiveAt: true } },
    },
  });

  return conversations.map((c) => {
    const isA = c.userAId === userId;
    return {
      id: c.id,
      otherUser: isA ? c.userB : c.userA,
      lastMessageAt: c.lastMessageAt,
      lastMessageText: c.lastMessageText,
      unread: isA ? c.unreadForA : c.unreadForB,
    };
  });
}

export async function getTotalUnread(userId: string): Promise<number> {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, unreadForA: true, unreadForB: true },
  });
  return conversations.reduce((sum, c) => sum + (c.userAId === userId ? c.unreadForA : c.unreadForB), 0);
}

/** Participante da conversa (pra checagem de acesso) — retorna null se
 *  `userId` nao faz parte dela. */
export async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.userAId !== userId && conversation.userBId !== userId)) return null;
  return conversation;
}

export async function getMessages(conversationId: string, userId: string, after?: Date) {
  const conversation = await assertParticipant(conversationId, userId);
  if (!conversation) return [];

  return prisma.message.findMany({
    where: { conversationId, ...(after ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      reactions: true,
      sharedTeam: {
        select: {
          id: true, name: true, battleFormat: true, generation: true,
          slots: { select: { species: { select: { name: true, spriteUrl: true } } }, orderBy: { position: 'asc' } },
        },
      },
    },
  });
}
