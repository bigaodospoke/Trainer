/**
 * Seed de formatos competitivos.
 * ---------------------------------------------------------------------------
 * Diferente de especies/moves/abilities/items, a LISTA de formatos relevantes
 * para o produto não vem de uma fonte externa única e estável — o pacote
 * @pkmn/dex inclui centenas de formatos (incluindo formatos "piada" e variantes
 * nicho do servidor do Showdown) que não fazem sentido como filtro de tier no
 * Trainerly. Por isso, a lista de formatos é curada aqui manualmente e
 * versionada como código — é a mesma decisão que um Team Builder real (ex.:
 * Pokémon Showdown) toma ao decidir quais formatos aparecem no dropdown
 * principal vs. "Other Metagames".
 *
 * O que VEM de fonte externa, sincronizado por scripts/sync/showdown.ts, é o
 * TIER de cada espécie all-time (campo `tier`/`doublesTier` do @pkmn/dex) —
 * isso sim é dado vivo, atualizado a cada sync.
 *
 * Execução: npm run db:seed (idempotente — pode rodar de novo sem duplicar)
 */
import { PrismaClient, Prisma } from '@prisma/client';
import type { GameType } from '../sync/schema-enums';

const prisma = new PrismaClient();

/** Mesma logica de retry de scripts/sync/showdown.ts — bancos serverless
 *  remotos (ex.: Neon) podem ter soluços transitorios de conexao. */
async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = attempt === retries;
      console.warn(`[seed:formats] erro transitorio em "${label}" (tentativa ${attempt}/${retries})${isLast ? '' : ' — tentando novamente...'}`);
      if (!isLast) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError;
}

interface FormatSeed {
  slug: string;
  name: string;
  generation: number;
  gameType: GameType;
  ruleset: Record<string, unknown>;
}

// Gen 9 — formatos "standard" do tier system singles (cada tier so bane a
// espécie do tier imediatamente acima; ver docs/ARCHITECTURE.md secao 5).
const SINGLES_TIERS: FormatSeed[] = [
  { slug: 'gen9ubers', name: 'Gen 9 Ubers', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Species Clause', 'Sleep Clause'] } },
  { slug: 'gen9ou', name: 'Gen 9 OU', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Species Clause', 'Sleep Clause'] } },
  { slug: 'gen9uu', name: 'Gen 9 UU', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Species Clause', 'Sleep Clause'] } },
  { slug: 'gen9ru', name: 'Gen 9 RU', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Species Clause', 'Sleep Clause'] } },
  { slug: 'gen9nu', name: 'Gen 9 NU', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Species Clause', 'Sleep Clause'] } },
  { slug: 'gen9pu', name: 'Gen 9 PU', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Species Clause', 'Sleep Clause'] } },
  { slug: 'gen9monotype', name: 'Gen 9 Monotype', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Same Type Clause'] } },
  { slug: 'gen9nationaldex', name: 'Gen 9 National Dex (AG)', generation: 9, gameType: 'SINGLES', ruleset: { clauses: ['Species Clause'] } },
];

const DOUBLES: FormatSeed[] = [
  { slug: 'gen9doublesou', name: 'Gen 9 Doubles OU', generation: 9, gameType: 'DOUBLES', ruleset: { clauses: ['Species Clause'] } },
  { slug: 'gen9doublesuu', name: 'Gen 9 Doubles UU', generation: 9, gameType: 'DOUBLES', ruleset: { clauses: ['Species Clause'] } },
];

// VGC: a regulação muda a cada poucos meses (Reg A, B, C...). Mantemos um
// formato "placeholder" estável; o Admin pode ajustar o `ruleset` (banlist da
// regulação vigente) sem precisar de deploy. Ver Fase 7 (Admin).
const VGC: FormatSeed[] = [
  {
    slug: 'gen9vgc-current',
    name: 'VGC (regulação vigente)',
    generation: 9,
    gameType: 'DOUBLES',
    ruleset: { clauses: ['Species Clause', 'Item Clause'], note: 'Atualizar banlist via Admin a cada nova regulamentação.' },
  },
];

async function main() {
  const all = [...SINGLES_TIERS, ...DOUBLES, ...VGC];

  for (const format of all) {
    await withRetry(
      () =>
        prisma.format.upsert({
          where: { slug: format.slug },
          create: {
            slug: format.slug,
            name: format.name,
            generation: format.generation,
            gameType: format.gameType,
            ruleset: format.ruleset as Prisma.InputJsonValue,
            isActive: true,
          },
          update: {
            name: format.name,
            gameType: format.gameType,
            ruleset: format.ruleset as Prisma.InputJsonValue,
          },
        }),
      format.slug
    );
    console.log(`[seed:formats] ok — ${format.slug}`);
  }

  console.log(`\n[seed:formats] ${all.length} formatos sincronizados.`);
}

main()
  .catch((err) => {
    console.error('[seed:formats] falhou:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
