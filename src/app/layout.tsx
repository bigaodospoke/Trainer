import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { Providers } from '@/components/providers/providers';
import { THEME_COOKIE, isThemeMode, resolveTheme, type ThemeMode } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trainerly',
  description:
    'Team Builder, Damage Calculator, Pokedex e analise de meta em um unico lugar, com IA integrada e identidade visual propria.',
  icons: {
    icon: '/icon.png',
  },
};

// Script inline minimo que roda antes da hidratacao, para aplicar a classe
// "light" (quando aplicavel) sem causar flash de tema errado no primeiro
// paint. So mexe em classList/style, nao bloqueia render.
const NO_FLASH_SCRIPT = `
(function() {
  try {
    var mode = document.documentElement.getAttribute('data-theme-mode') || 'dark';
    var resolved = mode;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'light') document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const rawMode = cookieStore.get(THEME_COOKIE)?.value;
  const mode: ThemeMode = isThemeMode(rawMode) ? rawMode : 'dark';
  const resolved = resolveTheme(mode);

  return (
    <html lang="pt-BR" className={resolved === 'light' ? 'light' : undefined} data-theme-mode={mode}>
      <head>
  <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />

  <Script
    async
    strategy="afterInteractive"
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6329130194994851"
    crossOrigin="anonymous"
  />
</head>
      <body className="font-body antialiased">
        <div className="tera-ambient" />
        <Providers initialThemeMode={mode}>{children}</Providers>
      </body>
    </html>
  );
}
