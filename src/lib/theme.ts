export type ThemeMode = 'dark' | 'light' | 'system';

export const THEME_COOKIE = 'trainerly-theme';

export function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === 'dark' || value === 'light' || value === 'system';
}

/** Resolve o modo salvo (que pode ser "system") para "dark" | "light" reais,
 *  usando a preferencia do SO quando necessario. No servidor, sem acesso a
 *  prefers-color-scheme, assume "dark" (identidade padrao do Trainerly). */
export function resolveTheme(mode: ThemeMode, systemPrefersDark = true): 'dark' | 'light' {
  if (mode === 'system') return systemPrefersDark ? 'dark' : 'light';
  return mode;
}
