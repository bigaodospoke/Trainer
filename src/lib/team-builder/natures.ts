export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
};

export interface NatureEffect {
  plus: StatKey | null;
  minus: StatKey | null;
}

/** Tabela oficial de naturezas — 20 tem +10%/-10% num stat (nunca HP), as
 *  outras 5 (Hardy/Docile/Serious/Bashful/Quirky) sao neutras. */
export const NATURE_EFFECTS: Record<string, NatureEffect> = {
  Hardy: { plus: null, minus: null },
  Lonely: { plus: 'atk', minus: 'def' },
  Brave: { plus: 'atk', minus: 'spe' },
  Adamant: { plus: 'atk', minus: 'spa' },
  Naughty: { plus: 'atk', minus: 'spd' },
  Bold: { plus: 'def', minus: 'atk' },
  Docile: { plus: null, minus: null },
  Relaxed: { plus: 'def', minus: 'spe' },
  Impish: { plus: 'def', minus: 'spa' },
  Lax: { plus: 'def', minus: 'spd' },
  Timid: { plus: 'spe', minus: 'atk' },
  Hasty: { plus: 'spe', minus: 'def' },
  Serious: { plus: null, minus: null },
  Jolly: { plus: 'spe', minus: 'spa' },
  Naive: { plus: 'spe', minus: 'spd' },
  Modest: { plus: 'spa', minus: 'atk' },
  Mild: { plus: 'spa', minus: 'def' },
  Quiet: { plus: 'spa', minus: 'spe' },
  Bashful: { plus: null, minus: null },
  Rash: { plus: 'spa', minus: 'spd' },
  Calm: { plus: 'spd', minus: 'atk' },
  Gentle: { plus: 'spd', minus: 'def' },
  Sassy: { plus: 'spd', minus: 'spe' },
  Careful: { plus: 'spd', minus: 'spa' },
  Quirky: { plus: null, minus: null },
};

/** "Timid (+Spe, -Atk)" — vazio pra naturezas neutras (so retorna o nome). */
export function formatNatureLabel(nature: string): string {
  const effect = NATURE_EFFECTS[nature];
  if (!effect || (!effect.plus && !effect.minus)) return nature;
  return `${nature} (+${STAT_LABELS[effect.plus!]}, -${STAT_LABELS[effect.minus!]})`;
}

export function natureMultiplier(nature: string, stat: StatKey): number {
  const effect = NATURE_EFFECTS[nature];
  if (!effect) return 1;
  if (effect.plus === stat) return 1.1;
  if (effect.minus === stat) return 0.9;
  return 1;
}
