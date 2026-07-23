import { prisma } from '@/lib/prisma';
import { computeTypeEffectiveness } from '@/lib/pokedex/type-effectiveness';
import { SPEED_CONTROL_MOVES, HAZARD_REMOVAL_MOVES } from './move-roles';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy',
];

const resistCache = new Map<string, string[]>();

/** Quais tipos (single) resistem ou sao imunes ao tipo `weakType` — dado
 *  estavel de jogo, cacheado em memoria (so 18 possibilidades). */
function typesThatResist(weakType: string): string[] {
  const cached = resistCache.get(weakType);
  if (cached) return cached;
  const result = ALL_TYPES.filter((d) => {
    const eff = computeTypeEffectiveness([d]);
    return eff.resistances.some((r) => r.type === weakType) || eff.immunities.some((r) => r.type === weakType);
  });
  resistCache.set(weakType, result);
  return result;
}

export interface SuggestionRow {
  slug: string;
  name: string;
  reason: string;
  iconSheetUrl: string | null;
  iconTop: number | null;
  iconLeft: number | null;
}

const SPECIES_SELECT = { slug: true, name: true, iconSheetUrl: true, iconTop: true, iconLeft: true } as const;

/** Sugestoes reais baseadas em dado (resistencia de tipo via damageTaken do
 *  @pkmn/dex, moveset real via LearnsetEntry) — NAO e um "meta pick"
 *  fabricado, e uma busca objetiva por Pokemon que resolvem uma lacuna
 *  detectada na analise do time. Restrito a formas BASE com tier no gen9ou
 *  (evita sugerir Pokemon totalmente inviaveis competitivamente). */
export async function suggestForWeakType(weakType: string, excludeIds: string[], limit = 3): Promise<SuggestionRow[]> {
  const resistingTypes = typesThatResist(weakType).map((t) => t.toUpperCase());
  if (resistingTypes.length === 0) return [];

  const rows = await prisma.pokemonSpecies.findMany({
    where: {
      types: { hasSome: resistingTypes as never },
      formKind: 'BASE',
      id: { notIn: excludeIds },
      tiers: { some: { format: { slug: 'gen9ou' } } },
    },
    select: SPECIES_SELECT,
    take: limit,
  });

  return rows.map((s: (typeof rows)[number]) => ({ ...s, reason: `Resiste a ${weakType}` }));
}

async function suggestByMoveRole(moveNames: string[], excludeIds: string[], reason: string, limit: number): Promise<SuggestionRow[]> {
  const moves = await prisma.move.findMany({ where: { name: { in: moveNames } }, select: { id: true } });
  if (moves.length === 0) return [];

  const rows = await prisma.pokemonSpecies.findMany({
    where: {
      formKind: 'BASE',
      id: { notIn: excludeIds },
      tiers: { some: { format: { slug: 'gen9ou' } } },
      learnset: { some: { moveId: { in: moves.map((m: { id: string }) => m.id) } } },
    },
    select: SPECIES_SELECT,
    take: limit,
  });

  return rows.map((s: (typeof rows)[number]) => ({ ...s, reason }));
}

export function suggestSpeedControl(excludeIds: string[], limit = 3) {
  return suggestByMoveRole(SPEED_CONTROL_MOVES, excludeIds, 'Traz Speed Control', limit);
}

export function suggestHazardRemoval(excludeIds: string[], limit = 3) {
  return suggestByMoveRole(HAZARD_REMOVAL_MOVES, excludeIds, 'Traz Hazard Removal', limit);
}
