'use client';

import { useState, useTransition } from 'react';
import { Copy, Check, Upload } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { importShowdownTeam } from './actions';

export function ImportExportPanel({ teamId, exportText }: { teamId: string; exportText: string }) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleImport() {
    startTransition(async () => {
      const result = await importShowdownTeam(teamId, importText);
      setWarnings(result.warnings);
      setImportedCount(result.ok ? result.importedCount : 0);
      if (result.ok) setImportText('');
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GlassCard padding="md">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink-primary">Exportar (Showdown)</h3>
          <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!exportText}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        <textarea
          readOnly
          value={exportText || '— adicione pelo menos um Pokémon para gerar o export —'}
          rows={10}
          className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 py-2.5 font-mono text-xs text-ink-muted outline-none"
        />
      </GlassCard>

      <GlassCard padding="md">
        <h3 className="mb-2 font-display text-sm font-semibold text-ink-primary">Importar (Showdown)</h3>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={10}
          placeholder={'Cole aqui um time no formato Showdown...\n\nLandorus-Therian @ Choice Scarf\nAbility: Intimidate\n...'}
          className="w-full rounded-xl border border-white/10 bg-void-surface/80 px-3 py-2.5 font-mono text-xs text-ink-primary placeholder:text-ink-dim outline-none focus:border-purple-neon/50 focus:ring-2 focus:ring-purple-neon/20"
        />
        <p className="mb-3 mt-1.5 text-xs text-ink-dim">
          Atenção: importar substitui todos os slots atuais deste time.
        </p>
        <Button size="sm" onClick={handleImport} disabled={!importText.trim() || isPending}>
          <Upload className="h-3.5 w-3.5" />
          {isPending ? 'Importando...' : 'Importar time'}
        </Button>

        {warnings !== null && (
          <div className="mt-3 flex flex-col gap-1 text-xs">
            <p className="text-ink-muted">{importedCount} Pokémon importado(s).</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-warning">
                ⚠ {w}
              </p>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
