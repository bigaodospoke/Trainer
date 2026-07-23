import { prisma } from '@/lib/prisma';

export interface RecentViewRow {
  id: string;
  targetType: 'POKEMON' | 'TEAM';
  viewedAt: Date;
  label: string;
  href: string;
  iconSheetUrl?: string | null;
  iconTop?: number | null;
  iconLeft?: number | null;
}

/** Ultimos itens vistos (Pokemon + Times), na conta do usuario. Busca as
 *  linhas de RecentView e resolve o label/link contra PokemonSpecies/Team —
 *  itens apagados (time deletado, etc.) sao silenciosamente pulados. */
export async function getRecentViews(userId: string, limit = 8): Promise<RecentViewRow[]> {
  const rows = await prisma.recentView.findMany({
    where: { userId },
    orderBy: { viewedAt: 'desc' },
    take: limit * 2, // folga pra compensar itens apagados que serao descartados
  });

  const pokemonIds = rows.filter((r) => r.targetType === 'POKEMON').map((r) => r.targetId);
  const teamIds = rows.filter((r) => r.targetType === 'TEAM').map((r) => r.targetId);

  const [species, teams] = await Promise.all([
    pokemonIds.length
      ? prisma.pokemonSpecies.findMany({
          where: { id: { in: pokemonIds } },
          select: { id: true, name: true, slug: true, iconSheetUrl: true, iconTop: true, iconLeft: true },
        })
      : Promise.resolve([]),
    teamIds.length
      ? prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  const speciesById = new Map(species.map((s: (typeof species)[number]) => [s.id, s]));
  const teamById = new Map(teams.map((t: (typeof teams)[number]) => [t.id, t]));

  const result: RecentViewRow[] = [];
  for (const row of rows) {
    if (row.targetType === 'POKEMON') {
      const sp = speciesById.get(row.targetId);
      if (!sp) continue;
      result.push({ id: row.id, targetType: 'POKEMON', viewedAt: row.viewedAt, label: sp.name, href: `/pokedex/${sp.slug}`, iconSheetUrl: sp.iconSheetUrl, iconTop: sp.iconTop, iconLeft: sp.iconLeft });
    } else {
      const team = teamById.get(row.targetId);
      if (!team) continue;
      result.push({ id: row.id, targetType: 'TEAM', viewedAt: row.viewedAt, label: team.name, href: `/team-builder/${team.id}` });
    }
    if (result.length >= limit) break;
  }

  return result;
}
