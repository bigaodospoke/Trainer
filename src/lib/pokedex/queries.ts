import { prisma } from '@/lib/prisma';

/**
 * Camada de leitura da Pokédex. Le do cache local sincronizado por
 * scripts/sync/showdown.ts (species/abilities/learnset/tiers) e, quando
 * disponível, de UsageStat (populado por scripts/sync/smogon.ts) para
 * "parceiros comuns".
 */

const PAGE_SIZE = 60;

export interface PokedexFilters {
  q?: string;
  type?: string;
  generation?: number;
  page?: number;
}

export async function searchSpecies(filters: PokedexFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const where = {
    AND: [
      filters.q ? { name: { contains: filters.q, mode: 'insensitive' as const } } : {},
      filters.type ? { types: { has: filters.type as never } } : {},
      filters.generation ? { generationIntroduced: filters.generation } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.pokemonSpecies.findMany({
      where,
      orderBy: { nationalDex: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        name: true,
        nationalDex: true,
        types: true,
        iconSheetUrl: true,
        iconTop: true,
        iconLeft: true,
        tiers: { where: { format: { slug: 'gen9ou' } }, select: { tier: true } },
      },
    }),
    prisma.pokemonSpecies.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getSpeciesDetail(slug: string) {
  return prisma.pokemonSpecies.findUnique({
    where: { slug },
    include: {
      abilities: { include: { ability: true }, orderBy: { slot: 'asc' } },
      tiers: { include: { format: true } },
      prevo: { select: { slug: true, name: true, iconSheetUrl: true, iconTop: true, iconLeft: true } },
      evolutions: {
        select: {
          slug: true,
          name: true,
          iconSheetUrl: true,
          iconTop: true,
          iconLeft: true,
          evoType: true,
          evoLevel: true,
          evoItem: true,
          evoMove: true,
          evoCondition: true,
        },
      },
      learnset: {
        include: { move: true },
        orderBy: [{ method: 'asc' }, { levelLearnedAt: 'asc' }],
      },
    },
  });
}

export async function getCommonTeammates(speciesId: string, formatSlug = 'gen9ou', limit = 8) {
  const format = await prisma.format.findUnique({ where: { slug: formatSlug } });
  if (!format) return [];

  const teammates = await prisma.usageStat.findMany({
    where: { speciesId, formatId: format.id, kind: 'TEAMMATE' },
    orderBy: { usagePercent: 'desc' },
    take: limit,
  });

  if (teammates.length === 0) return [];

  const partnerSpecies = await prisma.pokemonSpecies.findMany({
    where: { showdownId: { in: teammates.map((t: { refSlug: string }) => t.refSlug) } },
    select: { showdownId: true, slug: true, name: true, iconSheetUrl: true, iconTop: true, iconLeft: true },
  });
  const bySlug = new Map(
    partnerSpecies.map(
      (p: {
        showdownId: string;
        slug: string;
        name: string;
        iconSheetUrl: string | null;
        iconTop: number | null;
        iconLeft: number | null;
      }) => [p.showdownId, p] as const
    )
  );

  return teammates
    .map((t: { refSlug: string; usagePercent: number }) => {
      const partner = bySlug.get(t.refSlug);
      return partner ? { ...partner, usagePercent: t.usagePercent } : null;
    })
    .filter((t: { usagePercent: number } | null): t is NonNullable<typeof t> => t !== null);
}
