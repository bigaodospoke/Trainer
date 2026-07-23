/** Sprites do Lycanroc usados no Theme Toggle — Midday pro tema claro,
 *  Midnight pro tema escuro (ver form-filter.tsx no schema: as duas formas
 *  ja estao sincronizadas no banco como especies separadas, essas URLs sao
 *  exatamente as mesmas gravadas la por scripts/sync/showdown.ts). */
export const LYCANROC_SPRITES = {
  light: {
    battle: 'https://play.pokemonshowdown.com/sprites/gen5/lycanroc.png',
    icon: 'https://play.pokemonshowdown.com/sprites/dex/lycanroc.png',
  },
  dark: {
    battle: 'https://play.pokemonshowdown.com/sprites/gen5/lycanroc-midnight.png',
    icon: 'https://play.pokemonshowdown.com/sprites/dex/lycanroc-midnight.png',
  },
} as const;
