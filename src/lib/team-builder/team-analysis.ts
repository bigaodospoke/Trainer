import { computeTypeEffectiveness } from '@/lib/pokedex/type-effectiveness';
import {
  HAZARD_MOVES, HAZARD_REMOVAL_MOVES, SPEED_CONTROL_MOVES, PIVOT_MOVES, SCREEN_MOVES, RECOVERY_MOVES,
  WALLBREAKER_STAT_THRESHOLD,
} from './move-roles';

export interface AnalysisSlot {
  species: { types: string[]; baseAtk: number; baseSpa: number };
  moves: { move: { name: string; type: string } }[];
}

export interface CheckItem {
  ok: boolean;
  label: string;
}

export interface TeamAnalysis {
  hazards: CheckItem[];
  structure: CheckItem[];
  weakTypes: { type: string; count: number }[];
  resistedTypes: { type: string; count: number }[];
}

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function hasAnyMove(slots: AnalysisSlot[], moveNames: string[]): boolean {
  const set = new Set(moveNames.map((m) => m.toLowerCase()));
  return slots.some((s) => s.moves.some((m) => set.has(m.move.name.toLowerCase())));
}

/** Analise automatica do time — hazards, estrutura (atacante fisico/
 *  especial/speed control/pivot/wallbreaker), e fraquezas/resistencias
 *  agregadas (quantos membros do time sao fracos/resistem a cada tipo). Tudo
 *  calculado a partir de dados reais (types/stats/moveset), sem heuristica
 *  de "meta" inventada — so mecanica de jogo. */
export function analyzeTeam(slots: AnalysisSlot[]): TeamAnalysis {
  const hazards: CheckItem[] = [
    { ok: hasAnyMove(slots, HAZARD_MOVES), label: 'Possui Hazard (Stealth Rock/Spikes/Toxic Spikes/Sticky Web)' },
    { ok: hasAnyMove(slots, HAZARD_REMOVAL_MOVES), label: 'Possui Hazard Removal (Rapid Spin/Defog)' },
  ];

  const physicalAttackers = slots.filter((s) => s.species.baseAtk > s.species.baseSpa && s.species.baseAtk >= 90);
  const specialAttackers = slots.filter((s) => s.species.baseSpa > s.species.baseAtk && s.species.baseSpa >= 90);
  const wallbreakers = slots.filter((s) => Math.max(s.species.baseAtk, s.species.baseSpa) >= WALLBREAKER_STAT_THRESHOLD);

  const structure: CheckItem[] = [
    { ok: physicalAttackers.length > 0, label: 'Possui Physical Attacker' },
    { ok: specialAttackers.length > 0, label: 'Possui Special Attacker' },
    { ok: hasAnyMove(slots, SPEED_CONTROL_MOVES), label: 'Possui Speed Control' },
    { ok: hasAnyMove(slots, PIVOT_MOVES), label: 'Possui Pivot (U-turn/Volt Switch/Teleport)' },
    { ok: wallbreakers.length > 0, label: 'Possui Wallbreaker (Atk ou SpA base ≥ 110)' },
    { ok: hasAnyMove(slots, RECOVERY_MOVES), label: 'Possui recuperação de HP' },
    { ok: hasAnyMove(slots, SCREEN_MOVES), label: 'Possui Screens (Reflect/Light Screen)' },
  ];

  const weaknessCount = new Map<string, number>();
  const resistCount = new Map<string, number>();
  for (const slot of slots) {
    const eff = computeTypeEffectiveness(slot.species.types.map(toTitleCase));
    for (const w of eff.weaknesses) weaknessCount.set(w.type, (weaknessCount.get(w.type) ?? 0) + 1);
    for (const r of [...eff.resistances, ...eff.immunities]) resistCount.set(r.type, (resistCount.get(r.type) ?? 0) + 1);
  }

  const weakTypes = [...weaknessCount.entries()]
    .filter(([, count]) => count >= 3)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const resistedTypes = [...resistCount.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { hazards, structure, weakTypes, resistedTypes };
}
