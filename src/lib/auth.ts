import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/prisma';

/**
 * Autenticacao do MetaForge — Discord OAuth via Auth.js v5.
 *
 * O provider Discord por padrao mapeia o profile para o formato generico
 * {id, name, email, image} do Auth.js. Nosso schema usa nomes de campo
 * proprios (username, displayName, avatarUrl, discordId), entao sobrescrevemos
 * `profile()` para que o PrismaAdapter grave exatamente esses campos.
 *
 * NOTA DE PRODUCAO: nomes de usuario do Discord sao unicos na plataforma deles,
 * mas em caso de colisao de slug apos normalizacao (ex.: emojis/acentos), trate
 * isso em um hook `events.createUser` antes de habilitar cadastro em massa.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  pages: {
    signIn: '/signin',
  },
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          discordId: profile.id,
          username: profile.username,
          displayName: profile.global_name ?? profile.username,
          email: profile.email,
          avatarUrl: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
        };
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.username = user.username;
      session.user.role = user.role;
      session.user.avatarUrl = user.avatarUrl ?? null;
      return session;
    },
  },
});
