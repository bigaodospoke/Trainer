import { Dex } from '@pkmn/dex';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy',
];

/** damageTaken usa a codificacao do Pokemon Showdown: 0/ausente = normal
 *  (x1), 1 = super efetivo (x2), 2 = resistido (x0.5), 3 = imune (x0). */
function multiplierFor(code: number | undefined): number {
  if (code === 1) return 2;
  if (code === 2) return 0.5;
  if (code === 3) return 0;
  return 1;
}

export interface TypeEffectivenessRow {
  type: string;
  multiplier: number;
}

/** Combina o damageTaken de cada tipo do Pokemon (1 ou 2 tipos) pra montar
 *  a tabela de fraquezas/resistencias/imunidades final — usado na secao
 *  "Fraquezas e resistências" da Pokedex. */
export function computeTypeEffectiveness(types: string[]): {
  weaknesses: TypeEffectivenessRow[];
  resistances: TypeEffectivenessRow[];
  immunities: TypeEffectivenessRow[];
} {
  const rows: TypeEffectivenessRow[] = ALL_TYPES.map((attackingType) => {
    let multiplier = 1;
    for (const defendingType of types) {
      const typeData = Dex.types.get(defendingType);
      const code = typeData.exists ? typeData.damageTaken[attackingType as never] : undefined;
      multiplier *= multiplierFor(code as number | undefined);
    }
    return { type: attackingType, multiplier };
  });

  return {
    weaknesses: rows.filter((r) => r.multiplier > 1).sort((a, b) => b.multiplier - a.multiplier),
    resistances: rows.filter((r) => r.multiplier > 0 && r.multiplier < 1).sort((a, b) => a.multiplier - b.multiplier),
    immunities: rows.filter((r) => r.multiplier === 0),
  };
}
