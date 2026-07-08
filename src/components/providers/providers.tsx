'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/** Agrupa providers de cliente (sessao, e futuramente: tema, toasts, query client). */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
