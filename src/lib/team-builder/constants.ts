/**
 * Constantes do Team Builder — naturezas, tipos de Tera e a ordem dos tiers
 * (usada para validar legalidade: cada tier so bane a espécie do tier
 * imediatamente acima; ver docs/ARCHITECTURE.md secao 5).
 */

export const NATURES = [
  'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
  'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
  'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
  'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky',
] as const;

export const TERA_TYPES = [
  'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON',
  'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK',
  'STEEL', 'FAIRY', 'STELLAR',
] as const;

/** Ordem do mais restrito (topo) ao mais permissivo. Uma especie de tier X e
 *  legal em qualquer formato cujo tier esteja na mesma posicao ou abaixo —
 *  ex.: uma especie UU (indice 4) e legal em UU, RU, NU, PU (indices >= 4),
 *  mas NAO em OU/Ubers/AG (indices < 4). */
export const TIER_ORDER = [
  'AG', 'UBERS', 'OU', 'UUBL', 'UU', 'RUBL', 'RU', 'NUBL', 'NU', 'PUBL', 'PU', 'ZU',
] as const;

export type TierLabel = (typeof TIER_ORDER)[number] | 'DOUBLES_OU' | 'VGC' | 'UNTIERED';

export function tierRank(tier: string): number {
  const idx = TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

/** True se uma especie com `speciesTier` pode ser usada em um formato cujo
 *  tier de corte e `formatTier` (ex.: especie "UU", formato "OU" -> legal,
 *  pois OU permite tudo de UU pra baixo; especie "Uber", formato "OU" -> ilegal). */
export function isLegalForTier(speciesTier: string | null, formatTier: string): boolean {
  if (!speciesTier) return true; // sem tier conhecido — nao bloqueia (dado incompleto, nao ilegalidade)
  if (formatTier === 'AG' || formatTier === 'UNTIERED') return true;
  return tierRank(speciesTier) >= tierRank(formatTier);
}
