import { Sets, Teams } from '@pkmn/sets';

/**
 * Conversao entre o formato de texto do Showdown (o que o usuario cola/copia
 * no Team Builder) e a representacao da nossa aplicacao. Usa @pkmn/sets — a
 * mesma biblioteca que o proprio Showdown usa — em vez de um parser caseiro.
 *
 * Funcoes puras aqui (sem I/O); a resolucao de nomes -> IDs do banco e a
 * escrita ficam nas server actions (precisam do Prisma).
 */

export function toId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export interface StatBlock {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

const DEFAULT_IVS: StatBlock = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const DEFAULT_EVS: StatBlock = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

export interface ImportedSlot {
  speciesSlug: string;
  speciesName: string;
  nickname: string | null;
  gender: string | null;
  itemName: string | null;
  abilityName: string | null;
  teraType: string | null; // já em UPPERCASE, pronto para o enum PokemonType
  nature: string;
  level: number;
  shiny: boolean;
  evs: StatBlock;
  ivs: StatBlock;
  moveNames: string[]; // até 4
}

/** Faz parse de um time colado no formato texto do Showdown (múltiplos sets
 *  separados por linha em branco). Lança erro se o texto estiver vazio ou
 *  irreconhecível — quem chama deve capturar e mostrar mensagem amigável. */
export function parseShowdownTeamText(text: string): ImportedSlot[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const parsedTeam = Teams.importTeam(trimmed);
  if (!parsedTeam) {
    throw new Error('Não foi possível interpretar o texto colado como um time do Showdown.');
  }

  return parsedTeam.team
    .filter((set: NonNullable<typeof parsedTeam.team>[number]) => !!set.species)
    .map((set: NonNullable<typeof parsedTeam.team>[number]) => ({
      speciesSlug: toId(set.species!),
      speciesName: set.species!,
      nickname: set.name?.trim() ? set.name.trim() : null,
      gender: set.gender?.trim() ? set.gender.trim() : null,
      itemName: set.item?.trim() ? set.item.trim() : null,
      abilityName: set.ability?.trim() ? set.ability.trim() : null,
      teraType: set.teraType?.trim() ? set.teraType.trim().toUpperCase() : null,
      nature: set.nature?.trim() || 'Hardy',
      level: set.level ?? 100,
      shiny: !!set.shiny,
      evs: { ...DEFAULT_EVS, ...(set.evs ?? {}) },
      ivs: { ...DEFAULT_IVS, ...(set.ivs ?? {}) },
      moveNames: (set.moves ?? []).filter(Boolean).slice(0, 4),
    }));
}

/** Forma "achatada" de um TeamSlot + relacoes, exatamente o que e necessario
 *  para exportar — desacoplado do shape exato do Prisma para ficar testavel
 *  sem banco. */
export interface ExportableSlot {
  speciesName: string;
  nickname: string | null;
  gender: string | null;
  itemName: string | null;
  abilityName: string | null;
  teraType: string | null; // UPPERCASE (enum), convertido para Title Case na exportacao
  nature: string;
  level: number;
  shiny: boolean;
  evs: StatBlock;
  ivs: StatBlock;
  moveNames: string[];
}

export function buildExportSet(slot: ExportableSlot): string {
  const set = {
    name: slot.nickname ?? '',
    species: slot.speciesName,
    gender: slot.gender ?? '',
    item: slot.itemName ?? '',
    ability: slot.abilityName ?? '',
    teraType: slot.teraType ? toTitleCase(slot.teraType) : '',
    evs: slot.evs,
    ivs: slot.ivs,
    nature: slot.nature,
    level: slot.level,
    shiny: slot.shiny,
    moves: slot.moveNames,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return Sets.exportSet(set).trim();
}

export function buildExportTeamText(slots: ExportableSlot[]): string {
  return slots.map(buildExportSet).join('\n\n');
}
