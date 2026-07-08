'use client';

import { useActionState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile, type UpdateProfileResult } from './actions';

interface SettingsFormProps {
  username: string;
  displayName: string;
  bio: string;
}

export function SettingsForm({ username, displayName, bio }: SettingsFormProps) {
  const [result, formAction, isPending] = useActionState<UpdateProfileResult | null, FormData>(
    updateProfile,
    null
  );

  return (
    <GlassCard padding="lg" className="max-w-lg">
      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
            Usuario do Discord
          </label>
          <Input value={`@${username}`} disabled />
        </div>

        <div>
          <label htmlFor="displayName" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
            Nome de exibicao
          </label>
          <Input id="displayName" name="displayName" defaultValue={displayName} maxLength={32} required />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
            Biografia
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={bio}
            maxLength={280}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-dim outline-none transition-colors focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            placeholder="Conte um pouco sobre seu estilo de jogo..."
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar alteracoes'}
          </Button>
          {result?.ok === true && <span className="text-sm text-success">Salvo com sucesso.</span>}
          {result?.ok === false && <span className="text-sm text-danger">{result.error}</span>}
        </div>
      </form>
    </GlassCard>
  );
}
