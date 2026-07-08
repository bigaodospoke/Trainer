import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

/** Avatar com fallback de iniciais sobre um gradiente roxo quando nao ha imagem. */
export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn('rounded-full border border-white/10 object-cover', className)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'flex items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-purple-deep to-purple-core text-sm font-semibold text-ink-primary',
        className
      )}
    >
      {initials}
    </div>
  );
}
