'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return session!.user;
}

export async function toggleFollow(targetUserId: string, targetUsername: string) {
  const me = await requireUser();
  if (me.id === targetUserId) return;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: targetUserId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.follow.delete({ where: { id: existing.id } }),
      prisma.user.update({ where: { id: me.id }, data: { followingCount: { decrement: 1 } } }),
      prisma.user.update({ where: { id: targetUserId }, data: { followersCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.follow.create({ data: { followerId: me.id, followingId: targetUserId } }),
      prisma.user.update({ where: { id: me.id }, data: { followingCount: { increment: 1 } } }),
      prisma.user.update({ where: { id: targetUserId }, data: { followersCount: { increment: 1 } } }),
      prisma.activityEvent.create({
        data: { userId: me.id, type: 'USER_FOLLOWED', payload: { targetUserId, targetUsername } },
      }),
    ]);
  }

  revalidatePath(`/profile/${targetUsername}`);
}

export async function sendFriendRequest(targetUserId: string, targetUsername: string) {
  const me = await requireUser();
  if (me.id === targetUserId) return;

  const existing = await prisma.friend.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: me.id },
      ],
    },
  });
  if (existing) return;

  await prisma.friend.create({ data: { requesterId: me.id, addresseeId: targetUserId } });
  revalidatePath(`/profile/${targetUsername}`);
}

export async function respondFriendRequest(friendId: string, accept: boolean) {
  const me = await requireUser();
  const friend = await prisma.friend.findUnique({ where: { id: friendId } });
  if (!friend || friend.addresseeId !== me.id) throw new Error('Solicitação não encontrada.');

  if (accept) {
    await prisma.friend.update({ where: { id: friendId }, data: { status: 'ACCEPTED' } });
  } else {
    await prisma.friend.delete({ where: { id: friendId } });
  }

  revalidatePath('/dashboard');
}

export async function removeFriend(friendId: string, targetUsername: string) {
  const me = await requireUser();
  const friend = await prisma.friend.findUnique({ where: { id: friendId } });
  if (!friend || (friend.requesterId !== me.id && friend.addresseeId !== me.id)) {
    throw new Error('Amizade não encontrada.');
  }
  await prisma.friend.delete({ where: { id: friendId } });
  revalidatePath(`/profile/${targetUsername}`);
}
