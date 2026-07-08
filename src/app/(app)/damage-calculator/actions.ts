'use server';

import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface SaveCalculationInput {
  attackerSpeciesName: string;
  defenderSpeciesName: string;
  attackerConfig: unknown;
  defenderConfig: unknown;
  moveName: string;
  fieldConfig: unknown;
  resultSummary: unknown;
}

/**
 * Salva um cálculo no histórico do usuário. O Damage Calculator em si roda
 * 100% no navegador (não depende do nosso banco) — só esta ação de "salvar"
 * toca o Postgres, e por isso precisa que as espécies já estejam
 * sincronizadas (`npm run sync:showdown`) para resolver o nome -> ID.
 */
export async function saveCalculation(input: SaveCalculationInput) {
  const session = await auth();
  if (!session?.user) throw new Error('Não autenticado.');

  const [attackerSpecies, defenderSpecies] = await Promise.all([
    prisma.pokemonSpecies.findUnique({ where: { showdownId: toId(input.attackerSpeciesName) } }),
    prisma.pokemonSpecies.findUnique({ where: { showdownId: toId(input.defenderSpeciesName) } }),
  ]);

  if (!attackerSpecies || !defenderSpecies) {
    throw new Error('Espécie não encontrada no banco — rode npm run sync:showdown.');
  }

  await prisma.savedCalculation.create({
    data: {
      userId: session.user.id,
      attackerSpeciesId: attackerSpecies.id,
      defenderSpeciesId: defenderSpecies.id,
      attackerConfig: input.attackerConfig as Prisma.InputJsonValue,
      defenderConfig: input.defenderConfig as Prisma.InputJsonValue,
      moveSlug: toId(input.moveName),
      fieldConfig: input.fieldConfig as Prisma.InputJsonValue,
      resultSummary: input.resultSummary as Prisma.InputJsonValue,
    },
  });
}
