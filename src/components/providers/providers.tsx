'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { PreferencesProvider } from './preferences-provider';
import type { ThemeMode } from '@/lib/theme';

/** Agrupa providers de cliente (sessao, tema, preferencias, e futuramente: toasts, query client). */
export function Providers({
  children,
  initialThemeMode,
}: {
  children: ReactNode;
  initialThemeMode: ThemeMode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider initialMode={initialThemeMode}>
        <PreferencesProvider>{children}</PreferencesProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
