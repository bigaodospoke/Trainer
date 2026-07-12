'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Send, Smile, ImageIcon, Share2 } from 'lucide-react';
import type { getMessages } from '@/lib/messages/queries';
import { sendMessage, pollMessages, markConversationRead, toggleReaction, shareTeamInMessage, importSharedTeam } from '@/lib/messages/actions';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

type MessageItem = Awaited<ReturnType<typeof getMessages>>[number];

const POLL_MS = 3000;
const QUICK_EMOJIS = ['😀', '😂', '😍', '👍', '🔥', '🎉', '😢', '❤️', '🙏', '⚡'];
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function ChatWindow({
  conversationId,
  meId,
  initialMessages,
  myTeams,
}: {
  conversationId: string;
  meId: string;
  initialMessages: MessageItem[];
  myTeams: { id: string; name: string }[];
}) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [text, setText] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<Date | null>(
    initialMessages.length > 0 ? new Date(initialMessages[initialMessages.length - 1]!.createdAt) : null
  );

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      const fresh = await pollMessages(conversationId, lastTimestampRef.current?.toISOString());
      if (cancelled || fresh.length === 0) return;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const toAdd = fresh.filter((m) => !known.has(m.id));
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });
      lastTimestampRef.current = new Date(fresh[fresh.length - 1]!.createdAt);
      markConversationRead(conversationId);
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  async function handleSubmit(formData: FormData) {
    const content = text.trim();
    if (!content && !gifUrl) return;
    formData.set('content', content);
    formData.set('gifUrl', gifUrl);
    setText('');
    setGifUrl('');
    setShowGif(false);
    await sendMessage(conversationId, formData);
    const fresh = await pollMessages(conversationId);
    setMessages(fresh);
    if (fresh.length > 0) lastTimestampRef.current = new Date(fresh[fresh.length - 1]!.createdAt);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <GlassCard padding="md" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col gap-3">
          {messages.length === 0 && (
            <p className="m-auto text-sm text-ink-dim">Diga oi 👋 — essa é a primeira mensagem da conversa.</p>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} isMine={m.senderId === meId} onReact={(emoji) => startTransition(() => toggleReaction(m.id, emoji))} />
          ))}
          <div ref={bottomRef} />
        </div>
      </GlassCard>

      <form action={handleSubmit} className="flex flex-col gap-2">
        {showGif && (
          <input
            type="url"
            value={gifUrl}
            onChange={(e) => setGifUrl(e.target.value)}
            placeholder="Cole o link de um GIF (ex.: Tenor, Giphy)..."
            className="h-9 w-full rounded-lg border border-white/10 bg-void-surface/80 px-3 text-xs text-ink-primary outline-none focus:border-purple-neon/50"
          />
        )}
        {showShare && (
          <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-void-surface/80 p-2">
            {myTeams.length === 0 && <p className="text-xs text-ink-dim">Você não tem times pra compartilhar.</p>}
            {myTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => startTransition(async () => {
                  await shareTeamInMessage(conversationId, t.id);
                  setMessages(await pollMessages(conversationId));
                  setShowShare(false);
                })}
                className="rounded-pill border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-ink-primary hover:border-purple-neon/40"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        {showEmoji && (
          <div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-void-surface/80 p-2">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setText((t) => t + e)}
                className="rounded-lg px-1.5 py-1 text-lg hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowEmoji((s) => !s)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-ink-muted hover:text-ink-primary">
            <Smile className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button type="button" onClick={() => setShowGif((s) => !s)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-ink-muted hover:text-ink-primary">
            <ImageIcon className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button type="button" onClick={() => setShowShare((s) => !s)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-ink-muted hover:text-ink-primary">
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            placeholder="Escreva uma mensagem..."
            className="h-10 flex-1 rounded-xl border border-white/10 bg-void-surface/80 px-3.5 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
          />
          <Button type="submit" size="md">
            <Send className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message, isMine, onReact }: { message: MessageItem; isMine: boolean; onReact: (emoji: string) => void }) {
  const [showReactions, setShowReactions] = useState(false);
  const [importing, setImporting] = useState(false);

  const reactionCounts = new Map<string, number>();
  for (const r of message.reactions) reactionCounts.set(r.emoji, (reactionCounts.get(r.emoji) ?? 0) + 1);

  return (
    <div className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      <div className="relative max-w-[80%]">
        {message.sharedTeam ? (
          <div className="rounded-2xl border border-purple-neon/30 bg-purple-core/10 p-3">
            <p className="mb-2 text-xs font-medium text-ink-primary">📋 {message.sharedTeam.name}</p>
            <div className="mb-2 flex gap-1">
              {message.sharedTeam.slots.map((s, i) => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  {s.species.spriteUrl && <Image src={s.species.spriteUrl} alt={s.species.name} width={24} height={24} unoptimized />}
                </div>
              ))}
            </div>
            {!isMine && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={importing}
                onClick={async () => {
                  setImporting(true);
                  const teamId = await importSharedTeam(message.id);
                  window.location.href = `/team-builder/${teamId}`;
                }}
              >
                {importing ? 'Importando...' : 'Importar pro meu Team Builder'}
              </Button>
            )}
          </div>
        ) : message.gifUrl ? (
          <img src={message.gifUrl} alt="GIF" className="max-h-52 rounded-2xl border border-white/10" />
        ) : (
          <div className={`rounded-2xl px-3.5 py-2 text-sm ${isMine ? 'bg-purple-core/25 text-ink-primary' : 'bg-white/5 text-ink-primary'}`}>
            {message.content}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowReactions((s) => !s)}
          className="absolute -top-3 right-0 hidden h-6 w-6 items-center justify-center rounded-full bg-void-elevated text-xs text-ink-dim opacity-0 transition-opacity group-hover:flex group-hover:opacity-100"
        >
          +
        </button>
        {showReactions && (
          <div className="absolute -top-9 right-0 z-10 flex gap-0.5 rounded-full border border-white/10 bg-void-elevated px-1.5 py-1 shadow-panel">
            {REACTION_EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => { onReact(e); setShowReactions(false); }} className="rounded-full px-1 text-sm hover:bg-white/10">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {reactionCounts.size > 0 && (
        <div className="mt-1 flex gap-1">
          {[...reactionCounts.entries()].map(([emoji, count]) => (
            <span key={emoji} className="rounded-pill border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-ink-muted">
              {emoji} {count}
            </span>
          ))}
        </div>
      )}
      <span className="mt-0.5 text-[10px] text-ink-dim">
        {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
