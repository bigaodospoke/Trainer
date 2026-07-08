import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Icons } from '@pkmn/img';

/**
 * Dados do dex usados pelo Damage Calculator — carregados direto de
 * @pkmn/dex/@pkmn/img, sem tocar no nosso Postgres. É a mesma arquitetura da
 * calculadora oficial do Showdown: o calculo e os dados de especie/move/
 * ability/item rodam 100% no navegador. Por isso o calculator funciona
 * mesmo que `npm run sync:showdown` nunca tenha sido executado.
 *
 * Trade-off assumido: ~881 moves e ~1292 especies vão para o bundle do
 * cliente desta pagina especifica (code-split por rota pelo Next.js — nao
 * afeta o resto do site).
 */

export const gens = new Generations(Dex);
export const gen9 = gens.get(9);

export interface IconRef {
  iconSheetUrl: string | null;
  iconTop: number | null;
  iconLeft: number | null;
}

function pokemonIcon(name: string): IconRef {
  try {
    const icon = Icons.getPokemon(name);
    return { iconSheetUrl: icon.url, iconTop: icon.top, iconLeft: icon.left };
  } catch {
    return { iconSheetUrl: null, iconTop: null, iconLeft: null };
  }
}

function itemIcon(name: string): IconRef {
  try {
    const icon = Icons.getItem(name);
    return { iconSheetUrl: icon.url, iconTop: icon.top, iconLeft: icon.left };
  } catch {
    return { iconSheetUrl: null, iconTop: null, iconLeft: null };
  }
}

export const SPECIES_OPTIONS = (() => {
  const seen = new Set<string>();
  const list: { value: string; icon: IconRef }[] = [];
  for (const species of gen9.species) {
    if (species.isCosmeticForme || !species.exists) continue;
    if (seen.has(species.name)) continue;
    seen.add(species.name);
    list.push({ value: species.name, icon: pokemonIcon(species.name) });
  }
  return list.sort((a, b) => a.value.localeCompare(b.value));
})();

export const MOVE_OPTIONS = (() => {
  const list: { value: string }[] = [];
  for (const move of gen9.moves) {
    list.push({ value: move.name });
  }
  return list.sort((a, b) => a.value.localeCompare(b.value));
})();

export const ITEM_OPTIONS = (() => {
  const list: { value: string; icon: IconRef }[] = [];
  for (const item of gen9.items) {
    list.push({ value: item.name, icon: itemIcon(item.name) });
  }
  return list.sort((a, b) => a.value.localeCompare(b.value));
})();

export function getSpeciesAbilities(speciesName: string): { name: string; isHidden: boolean }[] {
  const species = gen9.species.get(speciesName);
  if (!species) return [];
  return Object.entries(species.abilities)
    .filter(([, name]) => !!name)
    .map(([key, name]) => ({ name: name as string, isHidden: key === 'H' }));
}

export function getSpeciesTypes(speciesName: string): string[] {
  return gen9.species.get(speciesName)?.types ?? [];
}

export function getSpeciesIcon(speciesName: string): IconRef {
  return pokemonIcon(speciesName);
}

export const WEATHER_OPTIONS = ['None', 'Sun', 'Rain', 'Sand', 'Snow'] as const;
export const TERRAIN_OPTIONS = ['None', 'Electric', 'Grassy', 'Misty', 'Psychic'] as const;
export const NATURES = [
  'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
  'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
  'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
  'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky',
] as const;
export const TERA_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy', 'Stellar',
] as const;
