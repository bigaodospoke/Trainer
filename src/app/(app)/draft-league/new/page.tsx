import { getAllFormats } from '@/lib/team-builder/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createLeague } from '../actions';

export default async function NewLeaguePage() {
  const formats = await getAllFormats();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Nova Draft League</h1>
      <GlassCard padding="lg" className="max-w-lg">
        <form action={createLeague} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Nome da liga</label>
            <Input name="name" placeholder="ex.: Liga Amigos 2025" required maxLength={60} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Formato</label>
            <select name="formatId" required className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20">
              <option value="">Selecione...</option>
              {formats.map((f: (typeof formats)[number]) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">Tamanho do elenco</label>
            <Input name="rosterSize" type="number" min={1} max={20} defaultValue={11} />
            <p className="mt-1 text-xs text-ink-dim">Número máximo de Pokémon que cada participante pode draftar.</p>
          </div>
          <Button type="submit" size="lg">Criar liga</Button>
        </form>
      </GlassCard>
    </div>
  );
}
