import type { SpeciesBuildComponents } from '@/lib/meta-analyzer/queries';

export interface RecommendedBuild {
  speciesName: string;
  label: string;
  tag: string;
  abilityName: string | null;
  itemName: string | null;
  teraType: string | null;
  moveNames: string[];
  howToUse: string;
}

/** Monta UMA build recomendada a partir dos componentes mais usados
 *  (getSpeciesBuildComponents) — a Smogon nao publica sets nomeados
 *  ("Choice Scarf", "Bulky Defensive"...) com % combinada nem texto
 *  estrategico, entao NAO inventamos multiplas builds com nomes/explicacoes
 *  fabricadas. Uma unica build "Most Used", honesta e com os numeros reais
 *  de cada componente na explicacao. */
export function buildMostUsedSet(speciesName: string, components: SpeciesBuildComponents): RecommendedBuild | null {
  if (components.moves.length === 0 && components.items.length === 0 && components.abilities.length === 0) {
    return null;
  }

  const topAbility = components.abilities[0] ?? null;
  const topItem = components.items[0] ?? null;
  const topTera = components.teraTypes[0] ?? null;
  const topMoves = components.moves.slice(0, 4);

  const parts: string[] = [];
  if (topItem) parts.push(`${topItem.usagePercent.toFixed(0)}% dos sets usam ${topItem.displayName}`);
  if (topAbility) parts.push(`${topAbility.usagePercent.toFixed(0)}% usam a ability ${topAbility.displayName}`);
  if (topTera) parts.push(`${topTera.usagePercent.toFixed(0)}% terastalizam para ${topTera.displayName}`);

  const howToUse = parts.length > 0
    ? `Set mais usado por treinadores no formato atual, montado a partir dos componentes reais de uso (chaos report da Smogon): ${parts.join(', ')}. Ajuste EVs/Nature/moveset conforme o papel que este Pokémon vai cumprir no seu time.`
    : 'Dados de uso insuficientes pra recomendar um set completo ainda — sincronize mais dados com npm run sync:smogon.';

  return {
    speciesName,
    label: 'Most Used Build',
    tag: '🔥 Most Used',
    abilityName: topAbility?.displayName ?? null,
    itemName: topItem?.displayName ?? null,
    teraType: topTera?.refSlug.toUpperCase() ?? null,
    moveNames: topMoves.map((m) => m.displayName),
    howToUse,
  };
}
