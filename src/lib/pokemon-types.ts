export interface TypeInfo {
  color: string;
  glyph: string;
}

/** Cor de identidade e glifo curto por tipo — usados pelo <TypeBadge/> para
 *  substituir o texto puro ("Grass", "Poison"...) por um icone visual. */
export const POKEMON_TYPES: Record<string, TypeInfo> = {
  Normal: { color: '#A6A17C', glyph: '●' },
  Fire: { color: '#EE8130', glyph: '🔥' },
  Water: { color: '#6493EE', glyph: '💧' },
  Electric: { color: '#F4D23C', glyph: '⚡' },
  Grass: { color: '#74CB48', glyph: '🌿' },
  Ice: { color: '#96D9D6', glyph: '❄' },
  Fighting: { color: '#C22E28', glyph: '✊' },
  Poison: { color: '#A43E9E', glyph: '☠' },
  Ground: { color: '#E2BF65', glyph: '⛰' },
  Flying: { color: '#A98FF3', glyph: '✈' },
  Psychic: { color: '#F95587', glyph: '✦' },
  Bug: { color: '#A6B91A', glyph: '🐛' },
  Rock: { color: '#B6A136', glyph: '🪨' },
  Ghost: { color: '#735797', glyph: '👻' },
  Dragon: { color: '#6F35FC', glyph: '🐉' },
  Dark: { color: '#5A5465', glyph: '🌙' },
  Steel: { color: '#B7B9D0', glyph: '⚙' },
  Fairy: { color: '#D685AD', glyph: '✿' },
};

export function getTypeInfo(type: string): TypeInfo {
  return POKEMON_TYPES[type] ?? { color: '#9B8BB8', glyph: '●' };
}
