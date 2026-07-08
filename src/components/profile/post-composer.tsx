'use client';
import { useTransition, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPost } from '@/app/(app)/profile/[username]/post-actions';

export function PostComposer() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createPost(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2">
      <textarea
        name="content"
        rows={3}
        maxLength={2000}
        required
        placeholder="Compartilhe uma análise, informação ou novidade sobre Pokémon..."
        className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-dim outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
      />
      <div className="flex items-center gap-2">
        <input
          name="imageUrl"
          type="url"
          placeholder="URL de imagem (opcional)"
          className="h-9 flex-1 rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          <Send className="h-3.5 w-3.5" />
          {isPending ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </form>
  );
}
