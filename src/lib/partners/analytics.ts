import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

/** Hash nao-reversivel de IP+User-Agent, so pra estimar visitantes unicos —
 *  nunca persiste o IP em si. */
export function hashVisitor(ip: string, userAgent: string): string {
  return createHash('sha256').update(`${ip}::${userAgent}`).digest('hex').slice(0, 32);
}

export async function logPartnerEvent(
  partnerId: string,
  type: 'PAGE_VIEW' | 'DISCORD_CLICK' | 'WEBSITE_CLICK' | 'STORE_CLICK' | 'BANNER_CLICK' | 'EVENT_CLICK',
  opts: { refId?: string; visitorHash?: string } = {}
) {
  await prisma.partnerAnalyticsEvent.create({
    data: { partnerId, type, refId: opts.refId, visitorHash: opts.visitorHash },
  });
}

export interface PartnerMetrics {
  pageViews: number;
  discordClicks: number;
  websiteClicks: number;
  storeClicks: number;
  bannerClicks: number;
  uniqueVisitors: number;
  topEvents: { refId: string; title: string; clicks: number }[];
}

export async function getPartnerMetrics(partnerId: string): Promise<PartnerMetrics> {
  const [counts, uniqueVisitors, eventClicks, events] = await Promise.all([
    prisma.partnerAnalyticsEvent.groupBy({
      by: ['type'],
      where: { partnerId },
      _count: { _all: true },
    }),
    prisma.partnerAnalyticsEvent.findMany({
      where: { partnerId, type: 'PAGE_VIEW', visitorHash: { not: null } },
      select: { visitorHash: true },
      distinct: ['visitorHash'],
    }),
    prisma.partnerAnalyticsEvent.groupBy({
      by: ['refId'],
      where: { partnerId, type: 'EVENT_CLICK', refId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { refId: 'desc' } },
      take: 5,
    }),
    prisma.partnerEvent.findMany({ where: { partnerId }, select: { id: true, title: true } }),
  ]);

  const countFor = (type: string) => counts.find((c) => c.type === type)?._count._all ?? 0;
  const eventTitle = new Map(events.map((e) => [e.id, e.title]));

  return {
    pageViews: countFor('PAGE_VIEW'),
    discordClicks: countFor('DISCORD_CLICK'),
    websiteClicks: countFor('WEBSITE_CLICK'),
    storeClicks: countFor('STORE_CLICK'),
    bannerClicks: countFor('BANNER_CLICK'),
    uniqueVisitors: uniqueVisitors.length,
    topEvents: eventClicks
      .filter((e) => e.refId)
      .map((e) => ({ refId: e.refId!, title: eventTitle.get(e.refId!) ?? 'Evento removido', clicks: e._count._all })),
  };
}
