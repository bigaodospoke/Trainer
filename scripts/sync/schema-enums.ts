/**
 * Espelho dos enums de prisma/schema.prisma, usado pelos scripts de
 * sync/seed em vez de importar os tipos de enum direto de '@prisma/client'.
 *
 * Por que: o '@prisma/client' so exporta os enums como objetos/tipos reais
 * depois que `npx prisma generate` roda com sucesso. Como union types de
 * string, estes tipos sao estruturalmente idênticos aos enums gerados pelo
 * Prisma (que tambem sao, por baixo dos panos, `{ X: 'X', ... } as const` +
 * union do values) — entao qualquer valor aqui tipado e aceito sem cast onde
 * o client real espera o enum, uma vez gerado.
 *
 * IMPORTANTE: se você alterar um enum em schema.prisma, atualize aqui também.
 */

export type DataSource = 'POKEAPI' | 'SHOWDOWN' | 'SMOGON' | 'MANUAL';

export type PokemonType =
  | 'NORMAL'
  | 'FIRE'
  | 'WATER'
  | 'ELECTRIC'
  | 'GRASS'
  | 'ICE'
  | 'FIGHTING'
  | 'POISON'
  | 'GROUND'
  | 'FLYING'
  | 'PSYCHIC'
  | 'BUG'
  | 'ROCK'
  | 'GHOST'
  | 'DRAGON'
  | 'DARK'
  | 'STEEL'
  | 'FAIRY'
  | 'STELLAR';

export type SpeciesFormKind =
  | 'BASE'
  | 'REGIONAL'
  | 'MEGA'
  | 'GMAX'
  | 'PARADOX'
  | 'ULTRA_BEAST'
  | 'PRIMAL'
  | 'OTHER_FORM';

export type MoveCategory = 'PHYSICAL' | 'SPECIAL' | 'STATUS';

export type LearnMethod = 'LEVEL_UP' | 'TM' | 'EGG' | 'TUTOR' | 'EVENT' | 'VIRTUAL_CONSOLE' | 'OTHER';

export type GameType = 'SINGLES' | 'DOUBLES';

export type TierLabel =
  | 'AG'
  | 'UBERS'
  | 'OU'
  | 'UUBL'
  | 'UU'
  | 'RUBL'
  | 'RU'
  | 'NUBL'
  | 'NU'
  | 'PUBL'
  | 'PU'
  | 'ZU'
  | 'DOUBLES_OU'
  | 'VGC'
  | 'UNTIERED';

export type UsageStatKind = 'SPECIES' | 'MOVE' | 'ITEM' | 'ABILITY' | 'TERA_TYPE' | 'TEAMMATE';

export type SyncStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
