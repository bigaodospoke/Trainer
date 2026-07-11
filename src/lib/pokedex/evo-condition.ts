export interface EvoConditionInput {
  evoType: string | null;
  evoLevel: number | null;
  evoItem: string | null;
  evoMove: string | null;
  evoCondition: string | null;
}

/** Traduz os campos evoType/evoLevel/evoItem/... (do dataset do Showdown)
 *  numa legenda curta em pt-BR pra mostrar ao lado da seta na linha
 *  evolutiva — ex.: "Nv. 16", "Pedra da Água", "Troca", "Amizade". */
export function formatEvoCondition(evo: EvoConditionInput): string | null {
  const extra = evo.evoCondition ? ` (${evo.evoCondition})` : '';

  switch (evo.evoType) {
    case 'levelMove':
    case 'levelExtra':
      return evo.evoLevel ? `Nv. ${evo.evoLevel}${extra}` : `Level up${extra}`;
    case 'levelFriendship':
      return `Amizade${evo.evoLevel ? ` (Nv. ${evo.evoLevel}+)` : ''}${extra}`;
    case 'levelHold':
      return evo.evoItem ? `Nv. up segurando ${evo.evoItem}${extra}` : `Level up segurando item${extra}`;
    case 'useItem':
      return evo.evoItem ? `Usar ${evo.evoItem}${extra}` : `Usar item${extra}`;
    case 'trade':
      return evo.evoItem ? `Troca segurando ${evo.evoItem}${extra}` : `Troca${extra}`;
    case 'other':
      return evo.evoCondition || 'Condição especial';
    default:
      if (evo.evoLevel) return `Nv. ${evo.evoLevel}`;
      return null;
  }
}
