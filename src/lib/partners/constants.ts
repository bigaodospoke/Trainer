export const PARTNER_TIER_ORDER = ['PARCEIRO', 'PARCEIRO_PLUS', 'PARCEIRO_PRO', 'PARCEIRO_ELITE'] as const;
export type PartnerTierValue = (typeof PARTNER_TIER_ORDER)[number];

/** Nome exato da tag (User.tags) que corresponde a cada tier — reusa o
 *  sistema de tags do admin (/admin/users) em vez de um model de role
 *  separado pra conceder acesso ao painel de parceiro. */
export const PARTNER_TIER_TAGS: Record<PartnerTierValue, string> = {
  PARCEIRO: 'Parceiro',
  PARCEIRO_PLUS: 'Parceiro Plus',
  PARCEIRO_PRO: 'Parceiro Pro',
  PARCEIRO_ELITE: 'Parceiro Elite',
};

export const PARTNER_TIER_LABELS: Record<PartnerTierValue, string> = {
  PARCEIRO: 'Parceiro',
  PARCEIRO_PLUS: 'Parceiro Plus',
  PARCEIRO_PRO: 'Parceiro Pro',
  PARCEIRO_ELITE: 'Parceiro Elite',
};

export const PARTNER_TIER_COLORS: Record<PartnerTierValue, string> = {
  PARCEIRO: '#9B8BB8',
  PARCEIRO_PLUS: '#8B5CF6',
  PARCEIRO_PRO: '#B266FF',
  PARCEIRO_ELITE: '#FFD166',
};

export const PARTNER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  SUSPENDED: 'Suspenso',
};

export const PARTNER_SERVER_STATUS_LABELS: Record<string, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  COMING_SOON: 'Em breve',
};

export const PARTNER_CATEGORY_LABELS: Record<string, string> = {
  COMPETITIVE: 'Competitivo',
  SURVIVAL: 'Survival',
  RPG: 'RPG',
  PIXELMON: 'Pixelmon',
  COBBLEMON: 'Cobblemon',
  MODPACK: 'Modpack',
};

export const PARTNER_CATEGORIES = Object.keys(PARTNER_CATEGORY_LABELS) as (keyof typeof PARTNER_CATEGORY_LABELS)[];

export const PARTNER_TIER_RANK_ORDER = ['S', 'A', 'B', 'C', 'D'] as const;

/** Devolve o tier de parceiro mais alto entre as tags do usuario, ou null se
 *  nenhuma tag de parceiro estiver presente — usado tanto pra liberar acesso
 *  ao painel quanto pra pre-preencher o tier ao criar o servidor. */
export function getHighestPartnerTier(tags: string[]): PartnerTierValue | null {
  for (let i = PARTNER_TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = PARTNER_TIER_ORDER[i]!;
    if (tags.includes(PARTNER_TIER_TAGS[tier])) return tier;
  }
  return null;
}

export function hasPartnerAccess(tags: string[]): boolean {
  return getHighestPartnerTier(tags) !== null;
}
