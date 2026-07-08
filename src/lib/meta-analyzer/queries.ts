import { prisma } from '@/lib/prisma';

/**
 * Camada de leitura do Meta Analyzer, sobre UsageStat (populado por
 * scripts/sync/smogon.ts).
 *
 * Nuance importante: os sub-relatórios da Smogon (Moves/Items/Abilities/
 * Tera Type) são POR ESPÉCIE (ex.: "Stealth Rock aparece em 70% dos sets de
 * Landorus-Therian"), não um agregado direto do formato. Para mostrar um
 * ranking "format-wide" honesto, ponderamos cada linha pelo usage% da
 * própria espécie: contribuição = usage%(espécie) × uso%(dimensão|espécie).
 * Isso aproxima "em quantos times desse formato esse move/item/ability
 * aparece", sem fingir ser um dado que a Smogon publica diretamente.
 */

export async function getAvailableMonths(formatId: string) {
  const rows = await prisma.usageStat.findMany({
    where: { formatId, kind: 'SPECIES' },
    distinct: ['month'],
    select: { month: true },
    orderBy: { month: 'desc' },
  });
  return rows.map((r: { month: Date }) => r.month);
}

export interface SpeciesUsageRow {
  speciesId: string;
  slug: string;
  name: string;
  iconSheetUrl: string | null;
  iconTop: number | null;
  iconLeft: number | null;
  usagePercent: number;
  rank: number | null;
  previousPercent: number | null;
}

export async function getSpeciesUsage(formatId: string, month: Date, previousMonth: Date | null, limit = 25): Promise<SpeciesUsageRow[]> {
  const rows = await prisma.usageStat.findMany({
    where: { formatId, month, kind: 'SPECIES' },
    orderBy: { usagePercent: 'desc' },
    take: limit,
  });

  const speciesIds = rows.map((r: { speciesId: string | null }) => r.speciesId).filter(Boolean) as string[];
  const species = await prisma.pokemonSpecies.findMany({
    where: { id: { in: speciesIds } },
    select: { id: true, slug: true, name: true, iconSheetUrl: true, iconTop: true, iconLeft: true },
  });

  interface SpeciesLite {
    id: string;
    slug: string;
    name: string;
    iconSheetUrl: string | null;
    iconTop: number | null;
    iconLeft: number | null;
  }

  const speciesById = new Map<string, SpeciesLite>(
    (species as SpeciesLite[]).map((s) => [s.id, s])
  );

  let previousById = new Map<string, number>();
  if (previousMonth) {
    const prevRows = await prisma.usageStat.findMany({
      where: { formatId, month: previousMonth, kind: 'SPECIES', speciesId: { in: speciesIds } },
      select: { speciesId: true, usagePercent: true },
    });
    previousById = new Map<string, number>(
      (prevRows as { speciesId: string | null; usagePercent: number }[]).map((r) => [r.speciesId as string, r.usagePercent])
    );
  }

  return rows
    .map((row: { speciesId: string | null; usagePercent: number; rank: number | null }) => {
      const sp = row.speciesId ? speciesById.get(row.speciesId) : undefined;
      if (!sp) return null;
      return {
        speciesId: row.speciesId as string,
        slug: sp.slug,
        name: sp.name,
        iconSheetUrl: sp.iconSheetUrl,
        iconTop: sp.iconTop,
        iconLeft: sp.iconLeft,
        usagePercent: row.usagePercent,
        rank: row.rank,
        previousPercent: row.speciesId ? previousById.get(row.speciesId) ?? null : null,
      };
    })
    .filter((r: SpeciesUsageRow | null): r is SpeciesUsageRow => r !== null);
}

export interface WeightedAggregateRow {
  refSlug: string;
  displayName: string;
  weightedPercent: number;
}

export async function getWeightedAggregate(
  formatId: string,
  month: Date,
  kind: 'MOVE' | 'ITEM' | 'ABILITY' | 'TERA_TYPE',
  limit = 15
): Promise<WeightedAggregateRow[]> {
  const [speciesRows, dimensionRows] = await Promise.all([
    prisma.usageStat.findMany({ where: { formatId, month, kind: 'SPECIES' }, select: { speciesId: true, usagePercent: true } }),
    prisma.usageStat.findMany({ where: { formatId, month, kind }, select: { speciesId: true, refSlug: true, usagePercent: true } }),
  ]);

  const speciesUsageById = new Map<string, number>(
    (speciesRows as { speciesId: string | null; usagePercent: number }[]).map((r) => [r.speciesId as string, r.usagePercent])
  );

  const totals = new Map<string, number>();
  for (const row of dimensionRows as { speciesId: string | null; refSlug: string; usagePercent: number }[]) {
    const speciesPct = (row.speciesId ? speciesUsageById.get(row.speciesId) : 0) ?? 0;
    const contribution = (speciesPct / 100) * (row.usagePercent / 100) * 100;
    totals.set(row.refSlug, (totals.get(row.refSlug) ?? 0) + contribution);
  }

  const topSlugs = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

  const displayNames = await resolveDisplayNames(kind, topSlugs.map(([slug]) => slug));

  return topSlugs.map(([refSlug, weightedPercent]) => ({
    refSlug,
    displayName: displayNames.get(refSlug) ?? refSlug,
    weightedPercent,
  }));
}

async function resolveDisplayNames(kind: 'MOVE' | 'ITEM' | 'ABILITY' | 'TERA_TYPE', slugs: string[]): Promise<Map<string, string>> {
  if (kind === 'TERA_TYPE') {
    return new Map(slugs.map((s) => [s, s.charAt(0).toUpperCase() + s.slice(1)]));
  }
  if (kind === 'MOVE') {
    const moves = await prisma.move.findMany({ where: { showdownId: { in: slugs } }, select: { showdownId: true, name: true } });
    return new Map(moves.map((m: { showdownId: string; name: string }) => [m.showdownId, m.name]));
  }
  if (kind === 'ITEM') {
    const items = await prisma.item.findMany({ where: { showdownId: { in: slugs } }, select: { showdownId: true, name: true } });
    return new Map(items.map((i: { showdownId: string; name: string }) => [i.showdownId, i.name]));
  }
  const abilities = await prisma.ability.findMany({ where: { showdownId: { in: slugs } }, select: { showdownId: true, name: true } });
  return new Map(abilities.map((a: { showdownId: string; name: string }) => [a.showdownId, a.name]));
}
