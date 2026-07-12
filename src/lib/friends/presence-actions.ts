'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Chamado periodicamente pelo client (ver PresenceHeartbeat) enquanto o
 *  usuario tem uma aba do site aberta — alimenta o status online/ausente/
 *  offline mostrado pra amigos (ver presenceStatus em @/lib/friends/queries).
 *  Sem sessao, e um no-op silencioso (evita erro em paginas publicas). */
export async function touchPresence() {
  const session = await auth();
  if (!session?.user) return;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastActiveAt: new Date() },
  });
}
