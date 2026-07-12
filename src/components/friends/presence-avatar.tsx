import { Avatar } from '@/components/ui/avatar';
import { presenceStatus } from '@/lib/friends/queries';
import { cn } from '@/lib/utils';

const DOT_COLOR = { online: 'bg-success', away: 'bg-warning', offline: 'bg-ink-dim' } as const;

export function PresenceAvatar({
  src,
  name,
  size = 40,
  lastActiveAt,
}: {
  src?: string | null;
  name: string;
  size?: number;
  lastActiveAt: Date | null;
}) {
  const status = presenceStatus(lastActiveAt);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Avatar src={src} name={name} size={size} />
      <span
        className={cn(
          'absolute bottom-0 right-0 block rounded-full border-2 border-void',
          DOT_COLOR[status]
        )}
        style={{ width: size * 0.3, height: size * 0.3 }}
        title={status === 'online' ? 'Online' : status === 'away' ? 'Ausente' : 'Offline'}
      />
    </div>
  );
}
