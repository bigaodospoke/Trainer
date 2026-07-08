'use client';
import { useState } from 'react';
import { Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CopyLinkButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <Button variant="secondary" size="sm" onClick={handle}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link className="h-3.5 w-3.5" />}
      {copied ? 'Link copiado!' : 'Copiar link'}
    </Button>
  );
}
