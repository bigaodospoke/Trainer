import { prisma } from '@/lib/prisma';
import { isLegalForTier } from './constants';

export interface TeamIssue {
  level: 'error' | 'warning';
  message: string;
}

/** Deriva o "tier de corte" do proprio formato a partir do slug — só os
 *  formatos singles padrão (OU/UU/RU/NU/PU/Ubers) tem um tier de corte que
 *  faz sentido comparar; outros formatos (monotype, national dex, doubles,
 *  VGC) não passam por esta checagem em v1. */
function getFormatTierLabel(slug: string): string | null {
  const map: Record<string, string> = {
    gen9ubers: 'UBERS',
    gen9ou: 'OU',
    gen9uu: 'UU',
    gen9ru: 'RU',
    gen9nu: 'NU',
    gen9pu: 'PU',
  };
  return map[slug] ?? null;
}

type TeamWithSlots = {
  formatId: string | null;
  format: { slug: string } | null;
  slots: {
    position: number;
    speciesId: string;
    species: { name: string };
    evHp: number;
    evAtk: number;
    evDef: number;
    evSpa: number;
    evSpd: number;
    evSpe: number;
    moves: { moveId: string }[];
  }[];
};

export async function computeTeamIssues(team: TeamWithSlots): Promise<TeamIssue[]> {
  const issues: TeamIssue[] = [];

  if (team.slots.length === 0) {
    issues.push({ level: 'warning', message: 'Este time ainda não tem nenhum Pokémon.' });
    return issues;
  }

  if (team.slots.length < 6) {
    issues.push({ level: 'warning', message: `Faltam ${6 - team.slots.length} slot(s) para completar o time.` });
  }

  const formatTier = team.format ? getFormatTierLabel(team.format.slug) : null;

  for (const slot of team.slots) {
    const evTotal = slot.evHp + slot.evAtk + slot.evDef + slot.evSpa + slot.evSpd + slot.evSpe;
    if (evTotal > 508) {
      issues.push({
        level: 'error',
        message: `${slot.species.name}: total de EVs (${evTotal}) excede o máximo de 508.`,
      });
    }

    const moveIds = slot.moves.map((m) => m.moveId);
    if (new Set(moveIds).size !== moveIds.length) {
      issues.push({ level: 'error', message: `${slot.species.name}: há golpes repetidos no set.` });
    }

    if (moveIds.length === 0) {
      issues.push({ level: 'warning', message: `${slot.species.name}: nenhum golpe selecionado.` });
    }

    if (formatTier && team.formatId) {
      const tierAssignment = await prisma.tierAssignment.findUnique({
        where: { speciesId_formatId: { speciesId: slot.speciesId, formatId: team.formatId } },
      });
      if (tierAssignment && !isLegalForTier(tierAssignment.tier, formatTier)) {
        issues.push({
          level: 'error',
          message: `${slot.species.name} é tier ${tierAssignment.tier} — não é legal em ${formatTier}.`,
        });
      }
    }
  }

  return issues;
}
