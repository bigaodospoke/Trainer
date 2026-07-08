import { cn } from '@/lib/utils';

interface SpriteIconProps {
  sheetUrl: string;
  top: number;
  left: number;
  width: number;
  height: number;
  alt: string;
  className?: string;
}

/**
 * Renderiza um icone a partir de um sprite sheet do Showdown (pokemonicons-
 * sheet.png ou itemicons-sheet.png), usando background-position — e não
 * next/image, já que isso nao e uma imagem individual e sim um recorte de
 * uma folha de sprites compartilhada.
 */
export function SpriteIcon({ sheetUrl, top, left, width, height, alt, className }: SpriteIconProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      title={alt}
      className={cn('shrink-0', className)}
      style={{
        width,
        height,
        imageRendering: 'pixelated',
        background: `transparent url(${sheetUrl}) no-repeat scroll ${left}px ${top}px`,
      }}
    />
  );
}

export function PokemonIcon({
  icon,
  alt,
  className,
}: {
  icon: { iconSheetUrl: string | null; iconTop: number | null; iconLeft: number | null };
  alt: string;
  className?: string;
}) {
  if (!icon.iconSheetUrl || icon.iconTop === null || icon.iconLeft === null) {
    return <div className={cn('shrink-0 rounded bg-white/5', className)} style={{ width: 40, height: 30 }} />;
  }
  return (
    <SpriteIcon
      sheetUrl={icon.iconSheetUrl}
      top={icon.iconTop}
      left={icon.iconLeft}
      width={40}
      height={30}
      alt={alt}
      className={className}
    />
  );
}

export function ItemIcon({
  icon,
  alt,
  className,
}: {
  icon: { iconSheetUrl: string | null; iconTop: number | null; iconLeft: number | null };
  alt: string;
  className?: string;
}) {
  if (!icon.iconSheetUrl || icon.iconTop === null || icon.iconLeft === null) {
    return <div className={cn('shrink-0 rounded bg-white/5', className)} style={{ width: 24, height: 24 }} />;
  }
  return (
    <SpriteIcon
      sheetUrl={icon.iconSheetUrl}
      top={icon.iconTop}
      left={icon.iconLeft}
      width={24}
      height={24}
      alt={alt}
      className={className}
    />
  );
}
