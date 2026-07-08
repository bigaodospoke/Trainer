'use client';

import { useState, useTransition } from 'react';
import { Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerDownload } from '../actions';

export function CopyExportButton({
  teamId,
  exportText,
  downloadsCount,
}: {
  teamId: string;
  exportText: string;
  downloadsCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
    startTransition(() => registerDownload(teamId));
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick} disabled={isPending}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
      {copied ? 'Copiado!' : `Exportar (${downloadsCount})`}
    </Button>
  );
}
