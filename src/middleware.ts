import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Protege rotas autenticadas (dashboard, settings, criacao de time, etc).
 * Visitantes nao logados sao redirecionados para /signin com `callbackUrl`
 * para retornar exatamente de onde sairam.
 *
 * Roda em runtime Node.js (estavel desde o Next.js 15.5) porque `auth()`
 * carrega o PrismaAdapter e o `jose` (JWT/criptografia), que dependem de
 * APIs Node (ex.: CompressionStream) indisponiveis no Edge Runtime.
 */
export default auth((req) => {
  console.log('AUTH NO MIDDLEWARE:', req.auth);
  const isLoggedIn = !!req.auth;
  if (!isLoggedIn) {
    const signInUrl = new URL('/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/team-builder/:path*',
    '/damage-calculator/:path*',
    '/pokedex/:path*',
    '/meta-analyzer/:path*',
    '/library/:path*',
    '/rankings/:path*',
    '/apoiadores/:path*',
    '/admin/:path*',
  ],
};
