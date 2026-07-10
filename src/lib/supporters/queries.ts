import { prisma } from '@/lib/prisma';

export const SUPPORTER_TIER_ORDER = ['DIAMOND', 'GOLD', 'SILVER', 'BRONZE'] as const;

export const SUPPORTER_TIER_META: Record<
  (typeof SUPPORTER_TIER_ORDER)[number],
  { label: string; stars: number; color: string }
> = {
  DIAMOND: { label: 'Diamante', stars: 4, color: '#B266FF' },
  GOLD: { label: 'Ouro', stars: 3, color: '#FFD166' },
  SILVER: { label: 'Prata', stars: 2, color: '#C7CDDB' },
  BRONZE: { label: 'Bronze', stars: 1, color: '#D9975B' },
};

/** Forma minima usada pela UI — evita depender do client Prisma gerado
 *  (rode `npx prisma generate` apos aplicar a migration do model Supporter
 *  para o tipo completo do model bater 1:1 com isto). */
export interface SupporterListItem {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
  tier: string;
  totalAmountCents: number;
  since: Date;
}

/** Todos os apoiadores ativos, ordenados por tier e depois por contribuicao
 *  total (usado tanto para a grade por categoria quanto para o ranking). */
export async function getActiveSupporters(): Promise<SupporterListItem[]> {
  return prisma.supporter.findMany({
    where: { isActive: true },
    orderBy: [{ totalAmountCents: 'desc' }, { since: 'asc' }],
  });
}

export function groupSupportersByTier(supporters: SupporterListItem[]) {
  const groups = new Map<string, SupporterListItem[]>();
  for (const tier of SUPPORTER_TIER_ORDER) groups.set(tier, []);
  for (const s of supporters) {
    if (!groups.has(s.tier)) groups.set(s.tier, []);
    groups.get(s.tier)!.push(s);
  }
  return groups;
}
