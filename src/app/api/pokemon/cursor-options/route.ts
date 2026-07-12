import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Busca leve de especies para o seletor de cursor personalizado
 *  (Configuracoes > Aparencia). So formas base com sprite sincronizado —
 *  Mega/Gmax/regionais ficam de fora pra manter a lista enxuta. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  const species = await prisma.pokemonSpecies.findMany({
    where: {
      formKind: 'BASE',
      spriteUrl: { not: null },
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    select: { slug: true, name: true, spriteUrl: true, types: true },
    orderBy: { nationalDex: 'asc' },
    take: 40,
  });

  return NextResponse.json({ species });
}
