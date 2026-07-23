/** Categorizacao de golpes por papel competitivo — mecanica de jogo estavel
 *  (nao e opiniao/estrategia inventada, e so "esse golpe poe hazard" etc.),
 *  usada pela analise automatica do time. Nomes em ingles pra bater com
 *  Move.name (fonte: Showdown). */
export const HAZARD_MOVES = ['Stealth Rock', 'Spikes', 'Toxic Spikes', 'Sticky Web'];
export const HAZARD_REMOVAL_MOVES = ['Rapid Spin', 'Defog', 'Court Change', 'Tidy Up', 'Mortal Spin'];
export const SPEED_CONTROL_MOVES = ['Tailwind', 'Thunder Wave', 'Sticky Web', 'Icy Wind', 'Electroweb', 'Trick Room', 'Glare'];
export const PIVOT_MOVES = ['U-turn', 'Volt Switch', 'Flip Turn', 'Teleport', 'Parting Shot', 'Baton Pass', 'Chilly Reception'];
export const SCREEN_MOVES = ['Reflect', 'Light Screen', 'Aurora Veil'];
export const RECOVERY_MOVES = ['Recover', 'Roost', 'Slack Off', 'Soft-Boiled', 'Synthesis', 'Moonlight', 'Morning Sun', 'Wish', 'Rest'];

/** Base >= esse valor no melhor de Atk/SpA conta como potencial "wallbreaker". */
export const WALLBREAKER_STAT_THRESHOLD = 110;
