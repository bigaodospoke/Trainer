/**
 * Worker de sincronização — Showdown (via ecossistema @pkmn)
 * ---------------------------------------------------------------------------
 * Fonte: @pkmn/dex + @pkmn/data (dex data, 100% local/offline, sem chamada de
 * rede) e @pkmn/img (URLs oficiais de sprite, hospedadas pela própria
 * Pokémon Showdown). Popula: PokemonSpecies, Move, Ability, Item,
 * PokemonAbility, LearnsetEntry e TierAssignment (tiers singles + Doubles OU).
 *
 * Por que @pkmn/dex e não scraping do client do Showdown: é o mesmo pacote
 * mantido pelo autor do Showdown, atualizado a cada patch/geração — ver
 * docs/ARCHITECTURE.md secao 2.2.
 *
 * Execução:
 *   npm run sync:showdown                — sync completo, grava no Postgres
 *   npm run sync:showdown -- --dry-run    — só extrai e imprime contagens,
 *                                           não escreve no banco (útil para
 *                                           validar antes de rodar de verdade)
 *
 * Pré-requisito: `npm run db:seed` (formatos) deve ter rodado antes, pois os
 * TierAssignment dependem dos Format já existirem.
 */
import { Generations, type Specie, type Move as DexMove, type Ability as DexAbility, type Item as DexItem } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Sprites, Icons } from '@pkmn/img';
import { PrismaClient } from '@prisma/client';
import type { SpeciesFormKind, PokemonType, MoveCategory, LearnMethod, TierLabel } from './schema-enums';

const ALL_GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const LATEST_GEN = 9;
const REGIONAL_PREFIXES = ['Alola', 'Galar', 'Hisui', 'Paldea'];

const gens = new Generations(Dex);

// -----------------------------------------------------------------------------
// Tipos intermediários (forma "achatada", pronta para upsert no Prisma)
// -----------------------------------------------------------------------------

interface ExtractedSpecies {
  showdownId: string;
  nationalDex: number;
  name: string;
  slug: string;
  generationIntroduced: number;
  formKind: SpeciesFormKind;
  baseSpeciesShowdownId: string | null;
  prevoShowdownId: string | null;
  types: PokemonType[];
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpa: number;
  baseSpd: number;
  baseSpe: number;
  weightKg: number | null;
  spriteUrl: string;
  spriteShinyUrl: string;
  spriteAnimatedUrl: string;
  spriteShinyAnimatedUrl: string;
  iconSheetUrl: string;
  iconTop: number;
  iconLeft: number;
  abilities: { slot: number; isHidden: boolean; abilityShowdownId: string }[];
  tier: TierLabel | null;
  doublesIsOU: boolean;
}

interface ExtractedMove {
  showdownId: string;
  name: string;
  slug: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  description: string;
  generationIntroduced: number;
}

interface ExtractedAbility {
  showdownId: string;
  name: string;
  slug: string;
  description: string;
  generationIntroduced: number;
}

interface ExtractedItem {
  showdownId: string;
  name: string;
  slug: string;
  description: string;
  iconSheetUrl: string;
  iconTop: number;
  iconLeft: number;
}

interface ExtractedLearnsetEntry {
  speciesShowdownId: string;
  moveShowdownId: string;
  generation: number;
  method: LearnMethod;
  levelLearnedAt: number | null;
}

// -----------------------------------------------------------------------------
// Helpers de classificação / parsing
// -----------------------------------------------------------------------------

function toId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Reexecuta `fn` em caso de erro transitorio de conexao (comum em bancos
 * serverless remotos como Neon durante scripts longos com milhares de
 * round-trips). Espera um pouco mais a cada tentativa.
 */
async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = attempt === retries;
      console.warn(`[sync:showdown] erro transitorio em "${label}" (tentativa ${attempt}/${retries})${isLast ? '' : ' — tentando novamente...'}`);
      if (!isLast) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError;
}

function classifyFormKind(species: Specie): SpeciesFormKind {
  if (species.isPrimal) return 'PRIMAL';
  if (species.isMega) return 'MEGA';
  if (species.forme?.includes('Gmax')) return 'GMAX';
  if (species.tags?.includes('Paradox')) return 'PARADOX';
  if (species.tags?.includes('Ultra Beast')) return 'ULTRA_BEAST';
  if (REGIONAL_PREFIXES.some((region) => species.forme?.startsWith(region))) {
    return 'REGIONAL';
  }
  if (species.baseSpecies && species.baseSpecies !== species.name) {
    return 'OTHER_FORM';
  }
  return 'BASE';
}

/** Mapa de tiers singles do Showdown -> nosso enum. Valores fora desta lista
 *  (ex.: "NFE", "LC", "Illegal", "(PU)") são tratados como nulo — não são
 *  tiers competitivos padrão, e sim marcadores internos do dex. */
const SINGLES_TIER_MAP: Record<string, TierLabel> = {
  AG: 'AG',
  Uber: 'UBERS',
  OU: 'OU',
  UUBL: 'UUBL',
  UU: 'UU',
  RUBL: 'RUBL',
  RU: 'RU',
  NUBL: 'NUBL',
  NU: 'NU',
  PUBL: 'PUBL',
  PU: 'PU',
  ZU: 'ZU',
};

/** Chaves conhecidas do objeto `abilities` do @pkmn/dex: '0'/'1' = abilities
 *  normais (slot 1/2), 'H' = hidden, 'S' = especial/evento (ex.: Battle Bond
 *  do Greninja, Power Construct do Zygarde, a Own Tempo de evento do
 *  Rockruff) — nunca documentado oficialmente, descoberto rodando o sync
 *  contra o dataset completo. Qualquer chave fora dessas é logada e
 *  ignorada (defensivo, em vez de gravar um slot incorreto silenciosamente
 *  caso o Showdown introduza uma chave nova no futuro). */
function mapAbilities(abilities: Specie['abilities'], speciesId: string): ExtractedSpecies['abilities'] {
  const result: ExtractedSpecies['abilities'] = [];

  for (const [key, name] of Object.entries(abilities)) {
    if (!name) continue;

    let slot: number;
    let isHidden = false;

    if (key === 'H') {
      slot = 3;
      isHidden = true;
    } else if (key === 'S') {
      slot = 4; // especial/evento
    } else {
      const numeric = Number(key);
      if (Number.isNaN(numeric)) {
        console.warn(`[sync:showdown] chave de ability desconhecida "${key}" em ${speciesId} — ignorada.`);
        continue;
      }
      slot = numeric + 1;
    }

    result.push({ slot, isHidden, abilityShowdownId: toId(name as string) });
  }

  return result;
}

function buildSpeciesRecord(species: Specie): ExtractedSpecies {
  const sprite = Sprites.getPokemon(species.name, { gen: 'gen5' });
  const spriteShiny = Sprites.getPokemon(species.name, { gen: 'gen5', shiny: true });
  const ani = Sprites.getPokemon(species.name, { gen: 'ani' });
  const aniShiny = Sprites.getPokemon(species.name, { gen: 'ani', shiny: true });
  const icon = Icons.getPokemon(species.name);

  return {
    showdownId: species.id,
    nationalDex: species.num,
    name: species.name,
    slug: toId(species.name),
    generationIntroduced: species.gen,
    formKind: classifyFormKind(species),
    baseSpeciesShowdownId:
      species.baseSpecies && species.baseSpecies !== species.name ? toId(species.baseSpecies) : null,
    prevoShowdownId: species.prevo ? toId(species.prevo) : null,
    types: species.types.map((t) => t.toUpperCase()) as PokemonType[],
    baseHp: species.baseStats.hp,
    baseAtk: species.baseStats.atk,
    baseDef: species.baseStats.def,
    baseSpa: species.baseStats.spa,
    baseSpd: species.baseStats.spd,
    baseSpe: species.baseStats.spe,
    weightKg: species.weightkg ?? null,
    spriteUrl: sprite.url,
    spriteShinyUrl: spriteShiny.url,
    spriteAnimatedUrl: ani.url,
    spriteShinyAnimatedUrl: aniShiny.url,
    iconSheetUrl: icon.url,
    iconTop: icon.top,
    iconLeft: icon.left,
    abilities: mapAbilities(species.abilities, species.id),
    tier: species.tier ? SINGLES_TIER_MAP[species.tier] ?? null : null,
    // Simplificação v1: só registramos "viável em Doubles OU" (DOU/DUber).
    // Tiers mais granulares de doubles (DUU, DNU...) ficam para uma fase
    // futura, quando adicionarmos esses valores ao enum TierLabel.
    doublesIsOU: species.doublesTier === 'DOU' || species.doublesTier === 'DUber',
  };
}

function buildMoveRecord(move: DexMove): ExtractedMove {
  return {
    showdownId: move.id,
    name: move.name,
    slug: move.id,
    type: move.type.toUpperCase() as PokemonType,
    category: move.category.toUpperCase() as MoveCategory,
    power: move.basePower > 0 ? move.basePower : null,
    accuracy: move.accuracy === true ? null : move.accuracy,
    pp: move.pp,
    priority: move.priority,
    description: move.shortDesc || move.desc || '',
    generationIntroduced: move.gen,
  };
}

function buildAbilityRecord(ability: DexAbility): ExtractedAbility {
  return {
    showdownId: ability.id,
    name: ability.name,
    slug: ability.id,
    description: ability.shortDesc || ability.desc || '',
    generationIntroduced: ability.gen,
  };
}

function buildItemRecord(item: DexItem): ExtractedItem {
  const icon = Icons.getItem(item.name);
  return {
    showdownId: item.id,
    name: item.name,
    slug: item.id,
    description: item.shortDesc || item.desc || '',
    iconSheetUrl: icon.url,
    iconTop: icon.top,
    iconLeft: icon.left,
  };
}

/** Codigo de learnset no formato Showdown, ex.: "9L65", "8M", "7S4", "9E". */
function parseLearnCode(code: string): { generation: number; method: LearnMethod; level: number | null } | null {
  const match = /^(\d+)([A-Za-z])(\d*)$/.exec(code);
  if (!match) return null;

  const generation = Number(match[1]!);
  const letter = match[2]!.toUpperCase();
  const detail = match[3] ?? '';

  const methodMap: Record<string, LearnMethod> = {
    L: 'LEVEL_UP',
    M: 'TM',
    T: 'TUTOR',
    E: 'EGG',
    S: 'EVENT',
    D: 'EVENT', // Dream World (Gen 5) — distribuicao especial, tratada como evento
    V: 'VIRTUAL_CONSOLE',
  };

  return {
    generation,
    method: methodMap[letter] ?? 'OTHER',
    level: letter === 'L' && detail ? Number(detail) : null,
  };
}

// -----------------------------------------------------------------------------
// Extração (pura, sem I/O de banco — testável isoladamente)
// -----------------------------------------------------------------------------

export function extractDexData() {
  const speciesMap = new Map<string, ExtractedSpecies>();
  const moveMap = new Map<string, ExtractedMove>();
  const abilityMap = new Map<string, ExtractedAbility>();
  const itemMap = new Map<string, ExtractedItem>();

  for (const genNum of ALL_GENERATIONS) {
    const gen = gens.get(genNum);

    for (const species of gen.species) {
      if (species.isCosmeticForme) continue;
      speciesMap.set(species.id, buildSpeciesRecord(species));
    }
    for (const move of gen.moves) {
      moveMap.set(move.id, buildMoveRecord(move));
    }
    for (const ability of gen.abilities) {
      abilityMap.set(ability.id, buildAbilityRecord(ability));
    }
    for (const item of gen.items) {
      itemMap.set(item.id, buildItemRecord(item));
    }
  }

  return { speciesMap, moveMap, abilityMap, itemMap };
}

/** Busca o learnset de cada espécie (usa o da base quando a forma nao tem um
 *  proprio — ex.: formas regionais às vezes tem learnset distinto, formas de
 *  batalha como Mega herdam o da base). Roda uma vez por especie-base unica. */
export async function extractLearnsets(
  speciesMap: Map<string, ExtractedSpecies>
): Promise<Map<string, ExtractedLearnsetEntry[]>> {
  const gen = gens.get(LATEST_GEN);
  const result = new Map<string, ExtractedLearnsetEntry[]>();
  const learnsetCache = new Map<string, Record<string, string[]> | undefined>();

  async function getLearnsetFor(showdownId: string): Promise<Record<string, string[]> | undefined> {
    if (learnsetCache.has(showdownId)) return learnsetCache.get(showdownId);
    const data = await gen.learnsets.get(showdownId as Parameters<typeof gen.learnsets.get>[0]);
    const learnset = data?.learnset as Record<string, string[]> | undefined;
    learnsetCache.set(showdownId, learnset);
    return learnset;
  }

  for (const species of speciesMap.values()) {
    let learnset = await getLearnsetFor(species.showdownId);
    if (!learnset && species.baseSpeciesShowdownId) {
      learnset = await getLearnsetFor(species.baseSpeciesShowdownId);
    }
    if (!learnset) continue;

    const entries: ExtractedLearnsetEntry[] = [];
    for (const [moveId, codes] of Object.entries(learnset)) {
      for (const code of codes) {
        const parsed = parseLearnCode(code);
        if (!parsed) continue;
        entries.push({
          speciesShowdownId: species.showdownId,
          moveShowdownId: moveId,
          generation: parsed.generation,
          method: parsed.method,
          levelLearnedAt: parsed.level,
        });
      }
    }
    result.set(species.showdownId, entries);
  }

  return result;
}

// -----------------------------------------------------------------------------
// Escrita no banco
// -----------------------------------------------------------------------------

async function writeToDatabase(
  prisma: PrismaClient,
  data: ReturnType<typeof extractDexData>,
  learnsets: Map<string, ExtractedLearnsetEntry[]>
) {
  let processed = 0;

  console.log(`[sync:showdown] gravando ${data.moveMap.size} moves...`);
  for (const move of data.moveMap.values()) {
    await withRetry(
      () =>
        prisma.move.upsert({
          where: { showdownId: move.showdownId },
          create: { ...move, source: 'SHOWDOWN', lastSyncedAt: new Date() },
          update: { ...move, lastSyncedAt: new Date() },
        }),
      `move ${move.showdownId}`
    );
    processed++;
  }

  console.log(`[sync:showdown] gravando ${data.abilityMap.size} abilities...`);
  for (const ability of data.abilityMap.values()) {
    await withRetry(
      () =>
        prisma.ability.upsert({
          where: { showdownId: ability.showdownId },
          create: { ...ability, source: 'SHOWDOWN', lastSyncedAt: new Date() },
          update: { ...ability, lastSyncedAt: new Date() },
        }),
      `ability ${ability.showdownId}`
    );
    processed++;
  }

  console.log(`[sync:showdown] gravando ${data.itemMap.size} items...`);
  for (const item of data.itemMap.values()) {
    await withRetry(
      () =>
        prisma.item.upsert({
          where: { showdownId: item.showdownId },
          create: { ...item, source: 'SHOWDOWN', lastSyncedAt: new Date() },
          update: { ...item, lastSyncedAt: new Date() },
        }),
      `item ${item.showdownId}`
    );
    processed++;
  }

  console.log(`[sync:showdown] gravando ${data.speciesMap.size} species (1a passada)...`);
  const idByShowdownId = new Map<string, string>();
  for (const species of data.speciesMap.values()) {
    const row = await withRetry(
      () =>
        prisma.pokemonSpecies.upsert({
          where: { showdownId: species.showdownId },
          create: {
            showdownId: species.showdownId,
            nationalDex: species.nationalDex,
            name: species.name,
            slug: species.slug,
            generationIntroduced: species.generationIntroduced,
            formKind: species.formKind,
            types: species.types,
            baseHp: species.baseHp,
            baseAtk: species.baseAtk,
            baseDef: species.baseDef,
            baseSpa: species.baseSpa,
            baseSpd: species.baseSpd,
            baseSpe: species.baseSpe,
            weightKg: species.weightKg,
            spriteUrl: species.spriteUrl,
            spriteShinyUrl: species.spriteShinyUrl,
            spriteAnimatedUrl: species.spriteAnimatedUrl,
            spriteShinyAnimatedUrl: species.spriteShinyAnimatedUrl,
            iconSheetUrl: species.iconSheetUrl,
            iconTop: species.iconTop,
            iconLeft: species.iconLeft,
            source: 'SHOWDOWN',
            lastSyncedAt: new Date(),
          },
          update: {
            nationalDex: species.nationalDex,
            name: species.name,
            formKind: species.formKind,
            types: species.types,
            baseHp: species.baseHp,
            baseAtk: species.baseAtk,
            baseDef: species.baseDef,
            baseSpa: species.baseSpa,
            baseSpd: species.baseSpd,
            baseSpe: species.baseSpe,
            weightKg: species.weightKg,
            spriteUrl: species.spriteUrl,
            spriteShinyUrl: species.spriteShinyUrl,
            spriteAnimatedUrl: species.spriteAnimatedUrl,
            spriteShinyAnimatedUrl: species.spriteShinyAnimatedUrl,
            iconSheetUrl: species.iconSheetUrl,
            iconTop: species.iconTop,
            iconLeft: species.iconLeft,
            lastSyncedAt: new Date(),
          },
        }),
      `species ${species.showdownId}`
    ) as { id: string };
    idByShowdownId.set(species.showdownId, row.id);
    processed++;
  }

  console.log('[sync:showdown] ligando formas a especie base (2a passada)...');
  for (const species of data.speciesMap.values()) {
    const baseId = species.baseSpeciesShowdownId ? idByShowdownId.get(species.baseSpeciesShowdownId) : undefined;
    const prevoId = species.prevoShowdownId ? idByShowdownId.get(species.prevoShowdownId) : undefined;
    if (!baseId && !prevoId) continue;
    await withRetry(
      () =>
        prisma.pokemonSpecies.update({
          where: { showdownId: species.showdownId },
          data: {
            ...(baseId ? { baseSpeciesId: baseId } : {}),
            ...(prevoId ? { prevoId } : {}),
          },
        }),
      `linkar forma/evolucao ${species.showdownId}`
    );
  }

  console.log('[sync:showdown] gravando abilities por especie...');
  const allAbilities: { id: string; showdownId: string }[] = await prisma.ability.findMany({
    select: { id: true, showdownId: true },
  });
  const abilityIdByShowdownId = new Map(allAbilities.map((a: { id: string; showdownId: string }) => [a.showdownId, a.id]));

  const pokemonAbilityRows: { speciesId: string; abilityId: string; slot: number; isHidden: boolean }[] = [];
  for (const species of data.speciesMap.values()) {
    const speciesId = idByShowdownId.get(species.showdownId);
    if (!speciesId) continue;
    for (const ab of species.abilities) {
      const abilityId = abilityIdByShowdownId.get(ab.abilityShowdownId);
      if (!abilityId) continue;
      pokemonAbilityRows.push({ speciesId, abilityId, slot: ab.slot, isHidden: ab.isHidden });
    }
  }

  await withRetry(
    () => prisma.pokemonAbility.deleteMany({ where: { speciesId: { in: [...idByShowdownId.values()] } } }),
    'limpar PokemonAbility antigos'
  );

  const ABILITY_BATCH_SIZE = 500;
  for (let i = 0; i < pokemonAbilityRows.length; i += ABILITY_BATCH_SIZE) {
    const batch = pokemonAbilityRows.slice(i, i + ABILITY_BATCH_SIZE);
    await withRetry(
      () => prisma.pokemonAbility.createMany({ data: batch, skipDuplicates: true }),
      `gravar lote de PokemonAbility (${i}-${i + batch.length})`
    );
  }
  console.log(`[sync:showdown] ${pokemonAbilityRows.length} PokemonAbility gravados.`);

  console.log('[sync:showdown] gravando learnsets (lote)...');
  const moveIdByShowdownId = new Map<string, string>();
  const allMoves = await prisma.move.findMany({ select: { id: true, showdownId: true } });
  for (const m of allMoves) moveIdByShowdownId.set(m.showdownId, m.id);

  const learnsetRows: {
    speciesId: string;
    moveId: string;
    generation: number;
    method: LearnMethod;
    levelLearnedAt: number | null;
  }[] = [];
  for (const [speciesShowdownId, entries] of learnsets) {
    const speciesId = idByShowdownId.get(speciesShowdownId);
    if (!speciesId) continue;
    for (const entry of entries) {
      const moveId = moveIdByShowdownId.get(entry.moveShowdownId);
      if (!moveId) continue;
      learnsetRows.push({
        speciesId,
        moveId,
        generation: entry.generation,
        method: entry.method,
        levelLearnedAt: entry.levelLearnedAt,
      });
    }
  }

  const BATCH_SIZE = 1000;
  for (let i = 0; i < learnsetRows.length; i += BATCH_SIZE) {
    const batch = learnsetRows.slice(i, i + BATCH_SIZE);
    await withRetry(
      () => prisma.learnsetEntry.createMany({ data: batch, skipDuplicates: true }),
      `gravar lote de LearnsetEntry (${i}-${i + batch.length})`
    );
    processed += batch.length;
  }
  console.log(`[sync:showdown] ${learnsetRows.length} entradas de learnset processadas.`);

  console.log('[sync:showdown] gravando TierAssignment (singles + Doubles OU)...');
  const singlesFormats = await prisma.format.findMany({
    where: { gameType: 'SINGLES', slug: { startsWith: 'gen9' } },
  });
  const doublesOuFormat = await prisma.format.findUnique({ where: { slug: 'gen9doublesou' } });
  const relevantFormatIds = [...singlesFormats.map((f: { id: string }) => f.id), ...(doublesOuFormat ? [doublesOuFormat.id] : [])];

  const tierRows: { speciesId: string; formatId: string; tier: TierLabel; source: 'SHOWDOWN' }[] = [];

  for (const species of data.speciesMap.values()) {
    const speciesId = idByShowdownId.get(species.showdownId);
    if (!speciesId) continue;

    if (species.tier) {
      for (const format of singlesFormats) {
        tierRows.push({ speciesId, formatId: format.id, tier: species.tier, source: 'SHOWDOWN' });
      }
    }

    if (species.doublesIsOU && doublesOuFormat) {
      tierRows.push({ speciesId, formatId: doublesOuFormat.id, tier: 'DOUBLES_OU', source: 'SHOWDOWN' });
    }
  }

  // Resync completo: apaga as atribuicoes anteriores destes formatos vindas
  // do Showdown e regrava do zero — poucas idas ao banco em vez de uma
  // upsert por especie x formato (que em um Postgres remoto, com milhares de
  // round-trips sequenciais, e lento e mais sujeito a queda de conexao).
  if (relevantFormatIds.length > 0) {
    await withRetry(
      () => prisma.tierAssignment.deleteMany({ where: { formatId: { in: relevantFormatIds }, source: 'SHOWDOWN' } }),
      'limpar TierAssignment antigos'
    );
  }

  const TIER_BATCH_SIZE = 500;
  for (let i = 0; i < tierRows.length; i += TIER_BATCH_SIZE) {
    const batch = tierRows.slice(i, i + TIER_BATCH_SIZE);
    await withRetry(
      () => prisma.tierAssignment.createMany({ data: batch, skipDuplicates: true }),
      `gravar lote de TierAssignment (${i}-${i + batch.length})`
    );
    processed += batch.length;
  }
  console.log(`[sync:showdown] ${tierRows.length} TierAssignment gravados.`);

  return processed;
}

// -----------------------------------------------------------------------------
// Entrypoint
// -----------------------------------------------------------------------------

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('[sync:showdown] extraindo dados do @pkmn/dex (offline, sem rede)...');
  const data = extractDexData();
  console.log(
    `[sync:showdown] extraido: ${data.speciesMap.size} species, ${data.moveMap.size} moves, ` +
      `${data.abilityMap.size} abilities, ${data.itemMap.size} items.`
  );

  console.log('[sync:showdown] extraindo learnsets...');
  const learnsets = await extractLearnsets(data.speciesMap);
  const totalLearnsetEntries = [...learnsets.values()].reduce((sum, arr) => sum + arr.length, 0);
  console.log(`[sync:showdown] learnsets extraidos para ${learnsets.size} species (${totalLearnsetEntries} entradas).`);

  if (isDryRun) {
    console.log('\n[sync:showdown] --dry-run: nenhuma escrita no banco foi feita.');
    return;
  }

  const prisma = new PrismaClient();
  const syncLog = await prisma.syncLog.create({
    data: { source: 'SHOWDOWN', status: 'RUNNING', triggeredBy: 'manual:cli' },
  });

  try {
    const processed = await writeToDatabase(prisma, data, learnsets);
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'SUCCESS', finishedAt: new Date(), recordsProcessed: processed },
    });
    await prisma.dataVersion.upsert({
      where: { source: 'SHOWDOWN' },
      create: { source: 'SHOWDOWN', version: new Date().toISOString() },
      update: { version: new Date().toISOString(), syncedAt: new Date() },
    });
    console.log(`\n[sync:showdown] concluido — ${processed} registros processados.`);
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'FAILED', finishedAt: new Date(), errorMessage: String(err) },
    });
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[sync:showdown] falhou:', err);
  process.exitCode = 1;
});
