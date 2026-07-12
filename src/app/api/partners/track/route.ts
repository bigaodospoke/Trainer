import { NextRequest, NextResponse } from 'next/server';
import { logPartnerEvent, hashVisitor } from '@/lib/partners/analytics';

const VALID_TYPES = ['DISCORD_CLICK', 'WEBSITE_CLICK', 'STORE_CLICK', 'BANNER_CLICK', 'EVENT_CLICK'] as const;

/** Redirect-through de tracking: <a href="/api/partners/track?partnerId=X&type=Y&to=Z">
 *  registra o clique e manda o visitante pro destino real — funciona sem JS
 *  no cliente (link normal), cobre todos os "cliques" pedidos nas metricas
 *  (Discord/Site/Loja/Banner/Evento) com uma unica rota. */
export async function GET(request: NextRequest) {
  const partnerId = request.nextUrl.searchParams.get('partnerId');
  const type = request.nextUrl.searchParams.get('type');
  const refId = request.nextUrl.searchParams.get('refId') ?? undefined;
  const to = request.nextUrl.searchParams.get('to');

  if (!partnerId || !type || !to || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: 'invalid params' }, { status: 400 });
  }

  let destination: URL;
  try {
    destination = new URL(to, request.nextUrl.origin);
  } catch {
    return NextResponse.json({ error: 'invalid destination' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  await logPartnerEvent(partnerId, type as (typeof VALID_TYPES)[number], {
    refId,
    visitorHash: hashVisitor(ip, userAgent),
  });

  return NextResponse.redirect(destination);
}
