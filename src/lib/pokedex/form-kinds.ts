/** Categorias de forma especial disponiveis como filtro na Pokedex — espelha
 *  o enum Prisma SpeciesFormKind, exceto BASE (que sempre aparece e nao e um
 *  filtro opcional). OTHER_FORM cobre formas de batalha/temporarias/
 *  alternativas que nao se encaixam nas categorias mais especificas — e a
 *  granularidade que o dado sincronizado (scripts/sync/showdown.ts) suporta
 *  hoje. */
export const FORM_KIND_FILTERS = [
  { value: 'MEGA', label: 'Mega Evoluções' },
  { value: 'GMAX', label: 'Gigantamax' },
  { value: 'REGIONAL', label: 'Formas Regionais' },
  { value: 'PARADOX', label: 'Paradox' },
  { value: 'ULTRA_BEAST', label: 'Ultra Beasts' },
  { value: 'PRIMAL', label: 'Regressão Primitiva' },
  { value: 'OTHER_FORM', label: 'Formas Alternativas / de Batalha / Temporárias' },
] as const;

export type FormKindFilterValue = (typeof FORM_KIND_FILTERS)[number]['value'];

export const FORM_KIND_LABELS: Record<string, string> = Object.fromEntries(
  FORM_KIND_FILTERS.map((f) => [f.value, f.label])
);
