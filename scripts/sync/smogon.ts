/**
 * Worker de sincronização — Smogon (usage stats / chaos reports)
 * ---------------------------------------------------------------------------
 * Fonte: smogon.com/stats/<ano-mes>/chaos/<formato>-<rating>.json — os
 * relatórios mensais de uso gerados a partir de milhões de batalhas no
 * Showdown. Ver docs/ARCHITECTURE.md secao 2.3.
 *
 * IMPORTANTE — limitação deste ambiente de desenvolvimento: o sandbox usado
 * para escrever este worker não tem acesso de rede a smogon.com (só
 * registries de pacote estão liberados). O FETCH real não pôde ser testado
 * aqui. O que foi validado:
 *   - a logica de parsing, contra um fixture sintetico (--fixture, ver
 *     scripts/sync/__fixtures__/README.md)
 *   - a logica de escrita no banco (upsert/delete+insert), na mesma medida
 *     em que o restante do projeto pode ser validado sem Postgres real
 *     (ver README.md raiz, secao de limitacoes)
 * Rode com um download real antes de habilitar isso em produção/cron — se o
 * formato do JSON da Smogon tiver mudado, ajuste `parseChaosReport`.
 *
 * Execução:
 *   npm run sync:smogon                              — todos os formatos rastreados
 *   npm run sync:smogon -- --format=gen9ou            — só um formato
 *   npm run sync:smogon -- --dry-run                  — so mostra o que seria feito
 *   npm run sync:smogon -- --fixture=<path> --format=gen9ou   — usa um JSON local
 *                                                                em vez de fetch
 */
import { PrismaClient, Prisma } from '@prisma/client';
import type { UsageStatKind } from './schema-enums';

const SMOGON_STATS_BASE_URL = process.env.SMOGON_STATS_BASE_URL ?? 'https://www.smogon.com/stats';

/** Formatos rastreados automaticamente. VGC fica de fora por agora: o id do
 *  metagame da Smogon para VGC inclui a regulacao vigente (ex.:
 *  "gen9vgc2024regh") e muda a cada poucos meses — ver
 *  docs/ARCHITECTURE.md secao 10. Adicione manualmente quando souber o id
 *  da regulacao atual. */
const TRACKED_FORMATS = [
  'gen9ubers',
  'gen9ou',
  'gen9uu',
  'gen9ru',
  'gen9nu',
  'gen9pu',
  'gen9monotype',
  'gen9nationaldex',
  'gen9doublesou',
  'gen9doublesuu',
];

const RATING_CANDIDATES = [1825, 1760, 1695, 1630, 1500, 1000, 0];
const MONTHS_TO_TRY = 6;

function toId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// -----------------------------------------------------------------------------
// Fetch (rede real) — busca o relatorio mais recente disponivel
// -----------------------------------------------------------------------------

interface ChaosFetchResult {
  month: string;
  rating: number;
  json: ChaosReport;
}

async function fetchLatestChaosReport(formatSlug: string): Promise<ChaosFetchResult | null> {
  for (const month of lastNMonths(MONTHS_TO_TRY)) {
    for (const rating of RATING_CANDIDATES) {
      const url = `${SMOGON_STATS_BASE_URL}/${month}/chaos/${formatSlug}-${rating}.json`;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = (await res.json()) as ChaosReport;
        return { month, rating, json };
      } catch {
        // tenta a proxima combinacao mes/rating
      }
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// Parsing (puro, testavel com fixture offline)
// -----------------------------------------------------------------------------

interface ChaosReport {
  info?: { metagame?: string; 'number of battles'?: number };
  data: Record<
    string,
    {
      'Raw count'?: number;
      usage: number;
      Abilities?: Record<string, number>;
      Items?: Record<string, number>;
      Moves?: Record<string, number>;
      Teammates?: Record<string, number>;
      'Tera Type'?: Record<string, number>;
    }
  >;
}

export interface ParsedUsageRow {
  speciesNameRaw: string;
  kind: UsageStatKind;
  refSlug: string;
  usagePercent: number;
  rank: number | null;
  raw: unknown;
}

export function parseChaosReport(report: ChaosReport): ParsedUsageRow[] {
  const rows: ParsedUsageRow[] = [];

  const speciesEntries = Object.entries(report.data).sort((a, b) => b[1].usage - a[1].usage);

  speciesEntries.forEach(([name, entry], index) => {
    const speciesSlug = toId(name);

    rows.push({
      speciesNameRaw: name,
      kind: 'SPECIES',
      refSlug: speciesSlug, // ver convencao em schema.prisma > UsageStat
      usagePercent: entry.usage * 100,
      rank: index + 1,
      raw: entry,
    });

    const subDimensions: { kind: UsageStatKind; data?: Record<string, number> }[] = [
      { kind: 'ABILITY', data: entry.Abilities },
      { kind: 'ITEM', data: entry.Items },
      { kind: 'MOVE', data: entry.Moves },
      { kind: 'TEAMMATE', data: entry.Teammates },
      { kind: 'TERA_TYPE', data: entry['Tera Type'] },
    ];

    for (const { kind, data } of subDimensions) {
      if (!data) continue;
      for (const [refName, fraction] of Object.entries(data)) {
        rows.push({
          speciesNameRaw: name,
          kind,
          refSlug: toId(refName),
          usagePercent: fraction * 100,
          rank: null,
          raw: null,
        });
      }
    }
  });

  return rows;
}

// -----------------------------------------------------------------------------
// Escrita no banco
// -----------------------------------------------------------------------------

async function writeUsageStats(
  prisma: PrismaClient,
  formatSlug: string,
  month: string,
  rows: ParsedUsageRow[]
): Promise<number> {
  const format = await prisma.format.findUnique({ where: { slug: formatSlug } });
  if (!format) {
    console.warn(`[sync:smogon] formato "${formatSlug}" nao existe no banco — rode "npm run db:seed" antes.`);
    return 0;
  }

  const allSpecies: { id: string; showdownId: string }[] = await prisma.pokemonSpecies.findMany({
    select: { id: true, showdownId: true },
  });
  const speciesIdBySlug = new Map(allSpecies.map((s: { id: string; showdownId: string }) => [s.showdownId, s.id]));

  const monthDate = new Date(`${month}-01T00:00:00.000Z`);

  // Snapshot mensal: substitui o mes inteiro deste formato em vez de fazer
  // upsert linha a linha — mais simples e evita a sutileza de unicidade do
  // Postgres com chaves compostas (ver comentario em schema.prisma).
  await prisma.usageStat.deleteMany({ where: { formatId: format.id, month: monthDate } });

  const payload = rows
    .map((row) => {
      const speciesId = speciesIdBySlug.get(toId(row.speciesNameRaw));
      if (!speciesId) return null;
      return {
        speciesId,
        formatId: format.id,
        kind: row.kind,
        refSlug: row.refSlug,
        month: monthDate,
        usagePercent: row.usagePercent,
        rank: row.rank,
        raw: (row.raw ?? undefined) as Prisma.InputJsonValue | undefined,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const BATCH_SIZE = 1000;
  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    await prisma.usageStat.createMany({ data: payload.slice(i, i + BATCH_SIZE), skipDuplicates: true });
  }

  // Enriquece TierAssignment.usagePercent com o usage% mais recente (kind=SPECIES).
  const speciesRows = payload.filter((r) => r.kind === 'SPECIES');
  for (const row of speciesRows) {
    await prisma.tierAssignment.updateMany({
      where: { speciesId: row.speciesId, formatId: format.id },
      data: { usagePercent: row.usagePercent },
    });
  }

  return payload.length;
}

// -----------------------------------------------------------------------------
// Entrypoint
// -----------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fixtureArg = args.find((a) => a.startsWith('--fixture='));
  const formatArg = args.find((a) => a.startsWith('--format='));
  return {
    dryRun,
    fixturePath: fixtureArg?.split('=')[1],
    formatSlug: formatArg?.split('=')[1],
  };
}

async function main() {
  const { dryRun, fixturePath, formatSlug } = parseArgs();
  const formats = formatSlug ? [formatSlug] : TRACKED_FORMATS;

  const prisma = dryRun ? null : new PrismaClient();
  const syncLog =
    prisma &&
    (await prisma.syncLog.create({ data: { source: 'SMOGON', status: 'RUNNING', triggeredBy: 'manual:cli' } }));

  let totalProcessed = 0;

  try {
    for (const slug of formats) {
      console.log(`\n[sync:smogon] === ${slug} ===`);

      let month: string;
      let report: ChaosReport;

      if (fixturePath) {
        const fs = await import('node:fs/promises');
        const raw = await fs.readFile(fixturePath, 'utf-8');
        report = JSON.parse(raw) as ChaosReport;
        month = lastNMonths(1)[0]!;
        console.log(`[sync:smogon] usando fixture local: ${fixturePath}`);
      } else {
        const result = await fetchLatestChaosReport(slug);
        if (!result) {
          console.warn(`[sync:smogon] nenhum relatorio encontrado para ${slug} nos ultimos ${MONTHS_TO_TRY} meses.`);
          continue;
        }
        month = result.month;
        report = result.json;
        console.log(`[sync:smogon] relatorio encontrado: ${month} (rating ${result.rating})`);
      }

      const rows = parseChaosReport(report);
      console.log(`[sync:smogon] ${rows.length} linhas extraidas (especies + moves/items/abilities/tera/teammates).`);

      if (dryRun) {
        console.log('[sync:smogon] --dry-run: nenhuma escrita no banco foi feita.');
        continue;
      }

      const written = await writeUsageStats(prisma!, slug, month, rows);
      console.log(`[sync:smogon] ${written} UsageStat gravados para ${slug}/${month}.`);
      totalProcessed += written;
    }

    if (syncLog && prisma) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'SUCCESS', finishedAt: new Date(), recordsProcessed: totalProcessed },
      });
      await prisma.dataVersion.upsert({
        where: { source: 'SMOGON' },
        create: { source: 'SMOGON', version: new Date().toISOString() },
        update: { version: new Date().toISOString(), syncedAt: new Date() },
      });
    }

    console.log(`\n[sync:smogon] concluido — ${totalProcessed} registros processados no total.`);
  } catch (err) {
    if (syncLog && prisma) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'FAILED', finishedAt: new Date(), errorMessage: String(err) },
      });
    }
    throw err;
  } finally {
    await prisma?.$disconnect();
  }
}

main().catch((err) => {
  console.error('[sync:smogon] falhou:', err);
  process.exitCode = 1;
});
