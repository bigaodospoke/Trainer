import { prisma } from '@/lib/prisma';

const TYPES = [
  'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON',
  'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK',
  'STEEL', 'FAIRY', 'STELLAR',
];

const TIERS = ['AG', 'UBERS', 'OU', 'UUBL', 'UU', 'RUBL', 'RU', 'NUBL', 'NU', 'PUBL', 'PU', 'ZU'];

export type SearchIntent =
  | { kind: 'name' }
  | { kind: 'type'; type: string }
  | { kind: 'tier'; tier: string }
  | { kind: 'move'; moveId: string; moveName: string }
  | { kind: 'ability'; abilityId: string; abilityName: string };

/** "Busca universal" da Pokedex — reconhece automaticamente se o texto
 *  digitado e um tipo, tier, golpe ou ability, sem o usuario precisar
 *  escolher uma categoria manualmente. Type/tier sao checados so contra
 *  listas fixas (gratis); move/ability precisam de 1 consulta indexada,
 *  só disparada com 4+ caracteres e so em match EXATO (evita falso positivo
 *  tipo "char" bater parcialmente em algum golpe/ability por acaso). */
export async function resolveSearchIntent(rawQuery: string): Promise<SearchIntent> {
  const q = rawQuery.trim();
  if (!q) return { kind: 'name' };

  const upper = q.toUpperCase();
  if (TYPES.includes(upper)) return { kind: 'type', type: upper };
  if (TIERS.includes(upper)) return { kind: 'tier', tier: upper };

  if (q.length >= 4) {
    const [move, ability] = await Promise.all([
      prisma.move.findFirst({ where: { name: { equals: q, mode: 'insensitive' } }, select: { id: true, name: true } }),
      prisma.ability.findFirst({ where: { name: { equals: q, mode: 'insensitive' } }, select: { id: true, name: true } }),
    ]);
    if (move) return { kind: 'move', moveId: move.id, moveName: move.name };
    if (ability) return { kind: 'ability', abilityId: ability.id, abilityName: ability.name };
  }

  return { kind: 'name' };
}
