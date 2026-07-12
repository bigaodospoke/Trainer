import Link from 'next/link';
import { Users, Search, UserPlus, Check, X, UserMinus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getFriendsList, getPendingRequests, presenceStatus, searchUsers } from '@/lib/friends/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PresenceAvatar } from '@/components/friends/presence-avatar';
import { sendFriendRequest, respondFriendRequest, removeFriend } from '../profile/[username]/actions';

interface AmigosPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AmigosPage({ searchParams }: AmigosPageProps) {
  const session = await auth();
  const me = session!.user;
  const { q } = await searchParams;

  const [friends, { received, sent }, searchResults] = await Promise.all([
    getFriendsList(me.id),
    getPendingRequests(me.id),
    q ? searchUsers(q, me.id) : Promise.resolve([]),
  ]);

  const friendIds = new Set(friends.map((f) => f.user.id));
  const sentIds = new Set(sent.map((s) => s.addressee.id));
  const receivedIds = new Set(received.map((r) => r.requester.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Amigos</h1>
          <p className="text-sm text-ink-muted">Encontre treinadores, envie pedidos e acompanhe quem está online.</p>
        </div>
      </div>

      <GlassCard padding="md">
        <form className="flex gap-2">
          <div className="flex-1">
            <Input name="q" defaultValue={q ?? ''} placeholder="Buscar por @username..." />
          </div>
          <Button type="submit" size="md">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </form>
      </GlassCard>

      {q && (
        <GlassCard padding="lg">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">
            Resultados para &quot;{q}&quot;
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-xs text-ink-dim">Nenhum usuário encontrado.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <PresenceAvatar src={u.avatarUrl} name={u.displayName ?? u.username} size={36} lastActiveAt={u.lastActiveAt} />
                  <Link href={`/profile/${u.username}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-primary hover:underline">@{u.username}</p>
                  </Link>
                  {friendIds.has(u.id) ? (
                    <span className="text-xs text-ink-dim">Já são amigos</span>
                  ) : sentIds.has(u.id) ? (
                    <span className="text-xs text-ink-dim">Pedido enviado</span>
                  ) : receivedIds.has(u.id) ? (
                    <span className="text-xs text-ink-dim">Te enviou um pedido</span>
                  ) : (
                    <form action={sendFriendRequest.bind(null, u.id, u.username)}>
                      <Button type="submit" size="sm" variant="secondary">
                        <UserPlus className="h-3.5 w-3.5" />
                        Adicionar
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {received.length > 0 && (
        <GlassCard padding="lg">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">
            Solicitações recebidas ({received.length})
          </h2>
          <div className="flex flex-col gap-2">
            {received.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <PresenceAvatar
                  src={r.requester.avatarUrl}
                  name={r.requester.displayName ?? r.requester.username}
                  size={36}
                  lastActiveAt={null}
                />
                <Link href={`/profile/${r.requester.username}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-primary hover:underline">@{r.requester.username}</p>
                </Link>
                <form action={respondFriendRequest.bind(null, r.id, true)}>
                  <Button type="submit" size="sm" variant="secondary">
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </form>
                <form action={respondFriendRequest.bind(null, r.id, false)}>
                  <Button type="submit" size="sm" variant="ghost">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {sent.length > 0 && (
        <GlassCard padding="lg">
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">
            Solicitações enviadas ({sent.length})
          </h2>
          <div className="flex flex-col gap-2">
            {sent.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <PresenceAvatar
                  src={s.addressee.avatarUrl}
                  name={s.addressee.displayName ?? s.addressee.username}
                  size={36}
                  lastActiveAt={null}
                />
                <Link href={`/profile/${s.addressee.username}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-primary hover:underline">@{s.addressee.username}</p>
                </Link>
                <form action={removeFriend.bind(null, s.id, undefined)}>
                  <Button type="submit" size="sm" variant="ghost">Cancelar</Button>
                </form>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard padding="lg">
        <h2 className="mb-4 font-display text-sm font-semibold text-ink-primary">
          Meus amigos ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <EmptyState title="Você ainda não tem amigos" description="Use a busca acima para encontrar treinadores e enviar pedidos de amizade." />
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map(({ friendshipId, user }) => {
              const status = presenceStatus(user.lastActiveAt);
              return (
                <div key={friendshipId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <PresenceAvatar src={user.avatarUrl} name={user.displayName ?? user.username} size={36} lastActiveAt={user.lastActiveAt} />
                  <Link href={`/profile/${user.username}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-primary hover:underline">@{user.username}</p>
                    <p className="text-[11px] text-ink-dim">
                      {status === 'online' ? 'Online' : status === 'away' ? 'Ausente' : 'Offline'}
                    </p>
                  </Link>
                  <Link href={`/mensagens/${user.username}`}>
                    <Button type="button" size="sm" variant="secondary">Mensagem</Button>
                  </Link>
                  <form action={removeFriend.bind(null, friendshipId, undefined)}>
                    <Button type="submit" size="sm" variant="ghost">
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
