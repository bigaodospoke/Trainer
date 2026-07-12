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
  link: string | null;
  message: string | null;
  tier: string;
  platform: string;
  totalAmountCents: number;
  since: Date;
}

/** As 3 plataformas de apoio fixas do Trainerly hoje — Pix, Ko-fi e
 *  Patreon. `getOrCreatePlatformCards` garante que essas 3 linhas existem
 *  (cria com link vazio na primeira vez) pra o admin so precisar colar o
 *  link de pagamento, sem ter que "criar" a plataforma do zero. */
const FIXED_PLATFORMS: { platform: 'PIX' | 'KOFI' | 'PATREON'; name: string }[] = [
  { platform: 'PIX', name: 'Pix' },
  { platform: 'KOFI', name: 'Ko-fi' },
  { platform: 'PATREON', name: 'Patreon' },
];

export async function getOrCreatePlatformCards() {
  const existing = await prisma.supporter.findMany({ where: { isPlatformCard: true } });
  const missing = FIXED_PLATFORMS.filter((p) => !existing.some((e) => e.platform === p.platform));

  if (missing.length > 0) {
    await prisma.supporter.createMany({
      data: missing.map((p) => ({
        name: p.name,
        platform: p.platform,
        isPlatformCard: true,
        isActive: true,
      })),
    });
    return prisma.supporter.findMany({ where: { isPlatformCard: true }, orderBy: { createdAt: 'asc' } });
  }

  return existing.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/** Apoiadores individuais ativos (exclui os cards fixos de plataforma),
 *  ordenados por tier e depois por contribuicao total. */
export async function getActiveSupporters(): Promise<SupporterListItem[]> {
  return prisma.supporter.findMany({
    where: { isActive: true, isPlatformCard: false },
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
