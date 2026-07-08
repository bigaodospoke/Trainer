import { getAllFormats } from '@/lib/team-builder/queries';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createTeam } from '../actions';

export default async function NewTeamPage() {
  const formats = await getAllFormats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Novo time</h1>

      <GlassCard padding="lg" className="max-w-lg">
        <form action={createTeam} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
              Nome do time
            </label>
            <Input id="name" name="name" placeholder="ex.: Sand Offense Gen9OU" maxLength={60} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="battleFormat" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
                Formato
              </label>
              <select
                id="battleFormat"
                name="battleFormat"
                defaultValue="SINGLES"
                className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
              >
                <option value="SINGLES">Singles</option>
                <option value="DOUBLES">Doubles</option>
                <option value="VGC">VGC</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div>
              <label htmlFor="generation" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
                Geração
              </label>
              <select
                id="generation"
                name="generation"
                defaultValue="9"
                className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
              >
                {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((g) => (
                  <option key={g} value={g}>
                    Gen {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="formatId" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-dim">
              Tier (opcional)
            </label>
            <select
              id="formatId"
              name="formatId"
              defaultValue=""
              className="h-10 w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 text-sm text-ink-primary outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
            >
              <option value="">Sem tier</option>
              {formats.map((f: (typeof formats)[number]) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-dim">
              Se a lista estiver vazia, rode <code>npm run db:seed</code> no projeto.
            </p>
          </div>

          <Button type="submit" size="lg">
            Criar time
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
