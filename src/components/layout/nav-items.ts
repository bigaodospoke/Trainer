import {
  LayoutDashboard,
  Swords,
  Calculator,
  BookOpen,
  TrendingUp,
  Library,
  Trophy,
  Heart,
  Star,
  Settings,
  ShieldCheck,
  Users,
  MessageCircle,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Fases futuras (Team Builder, Pokedex, etc.) apontam para paginas
   *  "em breve" ate a fase de dados/integracao ser concluida. */
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Team Builder', href: '/team-builder', icon: Swords },
  { label: 'Damage Calculator', href: '/damage-calculator', icon: Calculator },
  { label: 'Pokedex', href: '/pokedex', icon: BookOpen },
  { label: 'Meta Analyzer', href: '/meta-analyzer', icon: TrendingUp },
  { label: 'Biblioteca de Times', href: '/library', icon: Library },
  { label: 'Rankings', href: '/rankings', icon: Trophy },
  { label: 'Apoiadores', href: '/apoiadores', icon: Heart },
  { label: 'Amigos', href: '/amigos', icon: Users },
  { label: 'Mensagens', href: '/mensagens', icon: MessageCircle },
];

export interface SecondaryNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const SECONDARY_NAV_ITEMS: SecondaryNavItem[] = [
  { label: 'Meus Favoritos', href: '/favoritos', icon: Star },
  { label: 'Configuracoes', href: '/settings', icon: Settings },
];

export const ADMIN_NAV_ITEM: SecondaryNavItem = {
  label: 'Administracao',
  href: '/admin',
  icon: ShieldCheck,
};
