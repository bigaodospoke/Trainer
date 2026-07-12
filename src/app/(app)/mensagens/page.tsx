import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getConversationsList } from '@/lib/messages/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { PresenceAvatar } from '@/components/friends/presence-avatar';

export default async function MensagensPage() {
  const session = await auth();
  const conversations = await getConversationsList(session!.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Mensagens</h1>
          <p className="text-sm text-ink-muted">Conversas privadas com seus amigos.</p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <GlassCard padding="lg">
          <EmptyState
            title="Nenhuma conversa ainda"
            description='Vá até a página de Amigos e clique em "Mensagem" no perfil de um amigo pra começar a conversar.'
          />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <Link key={c.id} href={`/mensagens/${c.otherUser.username}`}>
              <GlassCard padding="md" hover className="flex items-center gap-3">
                <PresenceAvatar
                  src={c.otherUser.avatarUrl}
                  name={c.otherUser.displayName ?? c.otherUser.username}
                  size={44}
                  lastActiveAt={c.otherUser.lastActiveAt}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-primary">@{c.otherUser.username}</p>
                  <p className="truncate text-xs text-ink-dim">{c.lastMessageText || 'Sem mensagens ainda'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-ink-dim">
                    {new Date(c.lastMessageAt).toLocaleDateString('pt-BR')}
                  </span>
                  {c.unread > 0 && <Badge tone="purple">{c.unread}</Badge>}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
