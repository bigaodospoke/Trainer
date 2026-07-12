import { prisma } from '@/lib/prisma';

interface PokeApiSpeciesResponse {
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  egg_groups: { name: string }[];
  gender_rate: number; // -1 = sem genero, 0-8 = oitavos de chance de ser femea
}

/** Busca descricao (flavor text) e dados de breeding na PokeAPI sob demanda,
 *  na primeira vez que a pagina de detalhe de uma especie e aberta, e
 *  cacheia no banco (PokemonSpecies.flavorText/genderRatioFemale/eggGroups)
 *  pra nunca mais precisar buscar de novo. Falha silenciosamente — a secao
 *  de descricao so fica oculta se a PokeAPI estiver fora do ar, nao quebra
 *  a pagina. */
export async function getOrFetchFlavorText(species: {
  id: string;
  slug: string;
  flavorText: string | null;
  genderRatioFemale: number | null;
  eggGroups: string[];
}): Promise<{ flavorText: string | null; genderRatioFemale: number | null; eggGroups: string[] }> {
  if (species.flavorText || species.eggGroups.length > 0) {
    return {
      flavorText: species.flavorText,
      genderRatioFemale: species.genderRatioFemale,
      eggGroups: species.eggGroups,
    };
  }

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${species.slug}`, {
      next: { revalidate: false },
    });
    if (!res.ok) return { flavorText: null, genderRatioFemale: null, eggGroups: [] };

    const data: PokeApiSpeciesResponse = await res.json();
    const entry = data.flavor_text_entries.find((e) => e.language.name === 'pt') ??
      data.flavor_text_entries.find((e) => e.language.name === 'en');
    const flavorText = entry ? entry.flavor_text.replace(/[\n\f\r]+/g, ' ') : null;
    const genderRatioFemale = data.gender_rate >= 0 ? data.gender_rate / 8 : null;
    const eggGroups = data.egg_groups.map((g) => g.name);

    await prisma.pokemonSpecies.update({
      where: { id: species.id },
      data: { flavorText, genderRatioFemale, eggGroups },
    });

    return { flavorText, genderRatioFemale, eggGroups };
  } catch {
    return { flavorText: null, genderRatioFemale: null, eggGroups: [] };
  }
}
