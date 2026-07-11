const STAT_ABBR: Record<string, string> = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
const STAT_ORDER = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

/** "252 Atk / 4 Def / 252 Spe" — so os EVs investidos, na ordem convencional
 *  do Showdown. Vazio quando o time nao tem nenhum EV setado ainda. */
export function formatEvSpread(evs: Record<string, number>): string {
  const parts = STAT_ORDER.filter((k) => (evs[k] ?? 0) > 0).map((k) => `${evs[k]} ${STAT_ABBR[k]}`);
  return parts.join(' / ');
}

/** So mostra IVs que fogem do padrao competitivo (31, ou 0 em Atk pra sets
 *  especiais) — reduz ruido visual no card, igual ao Showdown so imprimir
 *  a linha "IVs:" quando ha algo fora do padrao. */
export function formatIvSpread(ivs: Record<string, number>): string {
  const parts = STAT_ORDER.filter((k) => (ivs[k] ?? 31) !== 31).map((k) => `${ivs[k]} ${STAT_ABBR[k]}`);
  return parts.join(' / ');
}

export const GENDER_SYMBOL: Record<string, string> = { M: '♂', F: '♀', N: '' };
