import { prisma } from '@/lib/prisma';

/**
 * Camada de leitura do Team Builder. Toda consulta aqui le do cache local
 * (PokemonSpecies/Move/Ability/Item/LearnsetEntry/TierAssignment) populado
 * pelos workers em scripts/sync/ — nunca chama uma API externa diretamente.
 */

export async function getAllSpeciesOptions() {
  return prisma.pokemonSpecies.findMany({
    select: { name: true, slug: true, nationalDex: true, iconSheetUrl: true, iconTop: true, iconLeft: true },
    orderBy: { nationalDex: 'asc' },
  });
}

export async function getAllItemOptions() {
  return prisma.item.findMany({
    select: { name: true, slug: true, iconSheetUrl: true, iconTop: true, iconLeft: true },
    orderBy: { name: 'asc' },
  });
}

export async function getSpeciesBySlug(slug: string, formatId?: string | null) {
  const species = await prisma.pokemonSpecies.findUnique({
    where: { slug },
    include: {
      abilities: { include: { ability: true }, orderBy: { slot: 'asc' } },
      tiers: formatId ? { where: { formatId } } : true,
    },
  });
  return species;
}

export async function getSpeciesById(id: string) {
  return prisma.pokemonSpecies.findUnique({
    where: { id },
    include: { abilities: { include: { ability: true }, orderBy: { slot: 'asc' } } },
  });
}

/** Golpes que a espécie pode aprender até a geração informada (aproximação
 *  v1: qualquer metodo registrado em qualquer geracao <= generation — ver
 *  docs/ARCHITECTURE.md para a simplificacao assumida aqui). */
export async function getLearnableMoves(speciesId: string, generation: number) {
  const entries = await prisma.learnsetEntry.findMany({
    where: { speciesId, generation: { lte: generation } },
    include: { move: true },
    distinct: ['moveId'],
    orderBy: { move: { name: 'asc' } },
  });
  return entries.map((e: { move: { id: string; name: string; type: string; category: string } }) => e.move);
}

export async function getItemBySlug(slug: string) {
  return prisma.item.findUnique({ where: { slug } });
}

export async function getMoveBySlug(slug: string) {
  return prisma.move.findUnique({ where: { slug } });
}

export async function getTierAssignment(speciesId: string, formatId: string) {
  return prisma.tierAssignment.findUnique({
    where: { speciesId_formatId: { speciesId, formatId } },
  });
}

export async function getAllFormats() {
  return prisma.format.findMany({ where: { isActive: true }, orderBy: { slug: 'asc' } });
}
