import type { Metadata } from 'next';
import { Providers } from '@/components/providers/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trainerly',
  description:
    'Team Builder, Damage Calculator, Pokedex e analise de meta em um unico lugar, com IA integrada e identidade visual propria.',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-body antialiased">
        <div className="tera-ambient" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
