import { prisma } from '@/lib/prisma';
import { toId } from '@/lib/team-builder/showdown-format';

export async function getMyPartnerServer(ownerId: string) {
  return prisma.partnerServer.findUnique({ where: { ownerId } });
}

export async function getPartnerServerForEdit(ownerId: string) {
  return prisma.partnerServer.findUnique({
    where: { ownerId },
    include: {
      images: { orderBy: { position: 'asc' } },
      events: { orderBy: { eventDate: 'desc' } },
      news: { orderBy: { publishedAt: 'desc' } },
      tierEntries: { include: { species: true }, orderBy: { rank: 'asc' } },
      banEntries: { include: { species: true } },
      teams: { include: { slots: { include: { species: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function getPartnerBySlug(slug: string) {
  return prisma.partnerServer.findUnique({
    where: { slug },
    include: {
      owner: { select: { username: true, displayName: true, avatarUrl: true } },
      images: { orderBy: { position: 'asc' } },
      events: { orderBy: { eventDate: 'asc' } },
      news: { orderBy: { publishedAt: 'desc' } },
      tierEntries: { include: { species: true } },
      banEntries: { include: { species: true } },
      teams: {
        include: {
          format: true,
          slots: {
            orderBy: { position: 'asc' },
            include: { species: true, item: true, ability: true, moves: { include: { move: true }, orderBy: { slot: 'asc' } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export interface PartnerListFilters {
  category?: string;
  q?: string;
}

/** Parceiros aprovados pra /partners — Elite e Pro primeiro (destaque), depois
 *  Plus, depois os demais, todos ordenados por criacao dentro do proprio tier. */
export async function getApprovedPartners(filters: PartnerListFilters = {}) {
  const partners = await prisma.partnerServer.findMany({
    where: {
      status: 'APPROVED',
      ...(filters.category ? { categories: { has: filters.category as never } } : {}),
      ...(filters.q ? { name: { contains: filters.q, mode: 'insensitive' as const } } : {}),
    },
    include: {
      _count: { select: { events: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  const tierWeight: Record<string, number> = { PARCEIRO_ELITE: 3, PARCEIRO_PRO: 2, PARCEIRO_PLUS: 1, PARCEIRO: 0 };
  return partners.sort((a, b) => (tierWeight[b.tier] ?? 0) - (tierWeight[a.tier] ?? 0));
}

export async function generateUniquePartnerSlug(name: string): Promise<string> {
  const base = toId(name) || 'servidor';
  let slug = base;
  let n = 1;
  while (await prisma.partnerServer.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Parceiros elegiveis pro destaque rotativo (Home/Biblioteca/Rankings/
 *  Pokedex) — so PRO e ELITE, aprovados. Pool ponderado: Elite aparece 3x
 *  mais que Pro no vetor de rotacao, satisfazendo "maior frequencia de
 *  exibicao" sem precisar de um scheduler/cron dedicado — a rotacao troca
 *  sozinha a cada ROTATION_WINDOW_MS conforme o relogio, sem estado salvo. */
const ROTATION_WINDOW_MS = 10 * 60 * 1000;

export async function getSpotlightPartner() {
  const eligible = await prisma.partnerServer.findMany({
    where: { status: 'APPROVED', tier: { in: ['PARCEIRO_PRO', 'PARCEIRO_ELITE'] } },
    orderBy: { createdAt: 'asc' },
  });
  if (eligible.length === 0) return null;

  const pool: (typeof eligible)[number][] = [];
  for (const p of eligible) pool.push(...Array(p.tier === 'PARCEIRO_ELITE' ? 3 : 1).fill(p));

  const index = Math.floor(Date.now() / ROTATION_WINDOW_MS) % pool.length;
  return pool[index]!;
}
