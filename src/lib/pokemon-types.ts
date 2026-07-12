export interface TypeInfo {
  color: string;
  glyph: string;
  /** Icone oficial do tipo, servido pelo CDN do Pokemon Showdown — mesmo
   *  dominio ja usado pelo resto do projeto para sprites/icones de especie
   *  e item (ver scripts/sync/showdown.ts, que grava iconSheetUrl a partir
   *  de @pkmn/img apontando para play.pokemonshowdown.com). */
  iconUrl: string;
}

const SHOWDOWN_TYPE_ICON_BASE = 'https://play.pokemonshowdown.com/sprites/types';

function typeIconUrl(fileName: string): string {
  return `${SHOWDOWN_TYPE_ICON_BASE}/${fileName}.png`;
}

/** Cor de identidade, glifo de fallback e icone oficial por tipo — usados
 *  pelo <TypeBadge/> para substituir o texto puro ("Grass", "Poison"...) por
 *  um icone visual. O glifo so aparece se o icone oficial falhar ao carregar. */
export const POKEMON_TYPES: Record<string, TypeInfo> = {
  Normal: { color: '#A6A17C', glyph: '●', iconUrl: typeIconUrl('Normal') },
  Fire: { color: '#EE8130', glyph: '🔥', iconUrl: typeIconUrl('Fire') },
  Water: { color: '#6493EE', glyph: '💧', iconUrl: typeIconUrl('Water') },
  Electric: { color: '#F4D23C', glyph: '⚡', iconUrl: typeIconUrl('Electric') },
  Grass: { color: '#74CB48', glyph: '🌿', iconUrl: typeIconUrl('Grass') },
  Ice: { color: '#96D9D6', glyph: '❄', iconUrl: typeIconUrl('Ice') },
  Fighting: { color: '#C22E28', glyph: '✊', iconUrl: typeIconUrl('Fighting') },
  Poison: { color: '#A43E9E', glyph: '☠', iconUrl: typeIconUrl('Poison') },
  Ground: { color: '#E2BF65', glyph: '⛰', iconUrl: typeIconUrl('Ground') },
  Flying: { color: '#A98FF3', glyph: '✈', iconUrl: typeIconUrl('Flying') },
  Psychic: { color: '#F95587', glyph: '✦', iconUrl: typeIconUrl('Psychic') },
  Bug: { color: '#A6B91A', glyph: '🐛', iconUrl: typeIconUrl('Bug') },
  Rock: { color: '#B6A136', glyph: '🪨', iconUrl: typeIconUrl('Rock') },
  Ghost: { color: '#735797', glyph: '👻', iconUrl: typeIconUrl('Ghost') },
  Dragon: { color: '#6F35FC', glyph: '🐉', iconUrl: typeIconUrl('Dragon') },
  Dark: { color: '#5A5465', glyph: '🌙', iconUrl: typeIconUrl('Dark') },
  Steel: { color: '#B7B9D0', glyph: '⚙', iconUrl: typeIconUrl('Steel') },
  Fairy: { color: '#D685AD', glyph: '✿', iconUrl: typeIconUrl('Fairy') },
  Stellar: { color: '#40B5A9', glyph: '✦', iconUrl: typeIconUrl('Stellar') },
};

export function getTypeInfo(type: string): TypeInfo {
  // Aceita tanto "Fire" (capitalizado) quanto "FIRE" (enum Prisma).
  const normalized =
    type.length > 1 ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : type;
  return (
    POKEMON_TYPES[type] ??
    POKEMON_TYPES[normalized] ?? { color: '#9B8BB8', glyph: '●', iconUrl: '' }
  );
}
