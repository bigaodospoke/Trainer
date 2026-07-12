import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateConversation, getMessages } from '@/lib/messages/queries';
import { PresenceAvatar } from '@/components/friends/presence-avatar';
import { ChatWindow } from '@/components/messages/chat-window';

interface ChatPageProps {
  params: Promise<{ username: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { username } = await params;
  const session = await auth();
  const me = session!.user;

  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, avatarUrl: true, lastActiveAt: true },
  });
  if (!other) notFound();
  if (other.id === me.id) notFound();

  const conversation = await getOrCreateConversation(me.id, other.id);
  const messages = await getMessages(conversation.id, me.id);

  const myTeams = await prisma.team.findMany({
    where: { ownerId: me.id },
    select: { id: true, name: true },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/mensagens" className="text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PresenceAvatar src={other.avatarUrl} name={other.displayName ?? other.username} size={36} lastActiveAt={other.lastActiveAt} />
        <p className="text-sm font-medium text-ink-primary">@{other.username}</p>
      </div>

      <ChatWindow
        conversationId={conversation.id}
        meId={me.id}
        initialMessages={messages}
        myTeams={myTeams}
      />
    </div>
  );
}
