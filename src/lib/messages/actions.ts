'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertParticipant, getMessages } from './queries';

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return session!.user;
}

/** Poll usado pelo client (ver ChatWindow) — busca so mensagens novas desde
 *  `afterIso`, ou o historico inteiro se omitido (carga inicial). */
export async function pollMessages(conversationId: string, afterIso?: string) {
  const me = await requireUser();
  const messages = await getMessages(conversationId, me.id, afterIso ? new Date(afterIso) : undefined);
  return messages;
}

export async function sendMessage(conversationId: string, formData: FormData) {
  const me = await requireUser();
  const conversation = await assertParticipant(conversationId, me.id);
  if (!conversation) throw new Error('Conversa não encontrada.');

  const content = String(formData.get('content') ?? '').trim().slice(0, 2000);
  const gifUrl = String(formData.get('gifUrl') ?? '').trim() || null;
  if (!content && !gifUrl) return;

  const otherIsA = conversation.userAId !== me.id;

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: me.id, content: content || null, gifUrl },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: content || (gifUrl ? '📎 GIF' : ''),
        ...(otherIsA ? { unreadForA: { increment: 1 } } : { unreadForB: { increment: 1 } }),
      },
    }),
  ]);

  revalidatePath('/mensagens');
}

export async function markConversationRead(conversationId: string) {
  const me = await requireUser();
  const conversation = await assertParticipant(conversationId, me.id);
  if (!conversation) return;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: conversation.userAId === me.id ? { unreadForA: 0 } : { unreadForB: 0 },
  });
  revalidatePath('/mensagens');
}

export async function toggleReaction(messageId: string, emoji: string) {
  const me = await requireUser();
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new Error('Mensagem não encontrada.');

  const participant = await assertParticipant(message.conversationId, me.id);
  if (!participant) throw new Error('Sem acesso a esta conversa.');

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId: me.id, emoji } },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({ data: { messageId, userId: me.id, emoji } });
  }

  revalidatePath('/mensagens');
}

/** Compartilha um time proprio via chat — so o dono pode compartilhar (evita
 *  vazar times privados de terceiros pelo chat). O destinatario precisa ser
 *  amigo do dono. */
export async function shareTeamInMessage(conversationId: string, teamId: string) {
  const me = await requireUser();
  const conversation = await assertParticipant(conversationId, me.id);
  if (!conversation) throw new Error('Conversa não encontrada.');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== me.id) throw new Error('Você só pode compartilhar times seus.');

  const otherIsA = conversation.userAId !== me.id;

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: me.id, sharedTeamId: teamId },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: `📋 Compartilhou o time "${team.name}"`,
        ...(otherIsA ? { unreadForA: { increment: 1 } } : { unreadForB: { increment: 1 } }),
      },
    }),
  ]);

  revalidatePath('/mensagens');
}

/** Clona um time recebido pelo chat pra dentro do Team Builder de quem
 *  importou — nunca referencia o time original (edicoes de um nao afetam o
 *  outro), e sempre entra como PRIVATE ate o novo dono decidir compartilhar. */
export async function importSharedTeam(messageId: string) {
  const me = await requireUser();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sharedTeam: {
        include: { slots: { include: { moves: true }, orderBy: { position: 'asc' } } },
      },
    },
  });
  if (!message?.sharedTeam) throw new Error('Time não encontrado nesta mensagem.');

  const participant = await assertParticipant(message.conversationId, me.id);
  if (!participant) throw new Error('Sem acesso a esta conversa.');

  const source = message.sharedTeam;

  const newTeam = await prisma.team.create({
    data: {
      ownerId: me.id,
      name: `${source.name} (importado)`,
      battleFormat: source.battleFormat,
      generation: source.generation,
      formatId: source.formatId,
    },
  });

  for (const slot of source.slots) {
    const newSlot = await prisma.teamSlot.create({
      data: {
        teamId: newTeam.id,
        speciesId: slot.speciesId,
        position: slot.position,
        nickname: slot.nickname,
        gender: slot.gender,
        level: slot.level,
        shiny: slot.shiny,
        abilityId: slot.abilityId,
        itemId: slot.itemId,
        natureName: slot.natureName,
        teraType: slot.teraType,
        ivHp: slot.ivHp, ivAtk: slot.ivAtk, ivDef: slot.ivDef, ivSpa: slot.ivSpa, ivSpd: slot.ivSpd, ivSpe: slot.ivSpe,
        evHp: slot.evHp, evAtk: slot.evAtk, evDef: slot.evDef, evSpa: slot.evSpa, evSpd: slot.evSpd, evSpe: slot.evSpe,
      },
    });
    for (const move of slot.moves) {
      await prisma.teamSlotMove.create({ data: { teamSlotId: newSlot.id, moveId: move.moveId, slot: move.slot } });
    }
  }

  await prisma.user.update({ where: { id: me.id }, data: { teamsCount: { increment: 1 } } });

  revalidatePath('/team-builder');
  return newTeam.id;
}
