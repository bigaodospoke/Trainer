import type { UserRole } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

/**
 * Estende o tipo Session do Auth.js com os campos proprios do Trainerly
 * (mapeados no callback `session` em src/lib/auth.ts).
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      avatarUrl: string | null;
      tags: string[];
    } & DefaultSession['user'];
  }
}

/**
 * O PrismaAdapter persiste exatamente os campos do nosso model `User`
 * (username, role, avatarUrl, displayName...), mas a interface generica
 * AdapterUser do Auth.js so conhece id/email/emailVerified/name/image por
 * padrao. Esta augmentation avisa o TypeScript sobre os campos extras que
 * de fato existem em runtime, usados no callback `session`.
 */
declare module '@auth/core/adapters' {
  interface AdapterUser {
    username: string;
    role: UserRole;
    avatarUrl: string | null;
    tags: string[];
  }
}
