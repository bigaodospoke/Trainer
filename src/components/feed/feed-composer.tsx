'use client';

import { useState } from 'react';
import { ImageIcon, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { createPost } from '@/app/(app)/feed/actions';

export function FeedComposer({ myTeams }: { myTeams: { id: string; name: string }[] }) {
  const [showImage, setShowImage] = useState(false);
  const [showTeams, setShowTeams] = useState(false);

  return (
    <GlassCard padding="lg">
      <form
        action={async (formData) => {
          await createPost(formData);
          setShowImage(false);
          setShowTeams(false);
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          name="content"
          maxLength={2000}
          rows={3}
          required
          placeholder="Compartilhe algo com a comunidade — um set, uma análise, uma novidade..."
          className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
        />

        {showImage && (
          <input
            name="imageUrl"
            type="url"
            placeholder="URL da imagem (opcional)"
            className="h-9 w-full rounded-lg border border-white/10 bg-void-surface/80 px-3 text-xs text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50"
          />
        )}

        {showTeams && (
          <select
            name="sharedTeamId"
            defaultValue=""
            className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50"
          >
            <option value="">Não compartilhar time</option>
            {myTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowImage((s) => !s)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-ink-muted hover:text-ink-primary"
              title="Adicionar imagem"
            >
              <ImageIcon className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setShowTeams((s) => !s)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-ink-muted hover:text-ink-primary"
              title="Compartilhar time"
            >
              <Swords className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <Button type="submit" size="sm">Publicar</Button>
        </div>
      </form>
    </GlassCard>
  );
}
