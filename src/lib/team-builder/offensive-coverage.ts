import { computeTypeEffectiveness } from '@/lib/pokedex/type-effectiveness';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy',
];

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export interface OffensiveCoverage {
  covered: string[];
  uncovered: string[];
}

/** Pra cada um dos 18 tipos defensivos, ve se algum tipo de golpe presente
 *  no time acerta ele super efetivo — "cobertura ofensiva" do time inteiro
 *  (independente de qual slot tem o golpe). */
export function computeOffensiveCoverage(moveTypes: string[]): OffensiveCoverage {
  const present = new Set(moveTypes.map(toTitleCase));
  const covered: string[] = [];
  const uncovered: string[] = [];

  for (const defType of ALL_TYPES) {
    const eff = computeTypeEffectiveness([defType]);
    const isSuperEffective = eff.weaknesses.some((w) => present.has(w.type));
    (isSuperEffective ? covered : uncovered).push(defType);
  }

  return { covered, uncovered };
}
