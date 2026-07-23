'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Registra uma visualizacao (upsert — o mesmo item so atualiza `viewedAt`,
 *  nunca duplica). Chamado por <RecordView/> ao montar a pagina de detalhe
 *  de um Pokemon ou de um time. No-op silencioso sem sessao (nao deveria
 *  acontecer, todo o app exige login, mas evita erro se acontecer). */
export async function recordRecentView(targetType: 'POKEMON' | 'TEAM', targetId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.recentView.upsert({
    where: { userId_targetType_targetId: { userId: session.user.id, targetType, targetId } },
    create: { userId: session.user.id, targetType, targetId },
    update: { viewedAt: new Date() },
  });
}
