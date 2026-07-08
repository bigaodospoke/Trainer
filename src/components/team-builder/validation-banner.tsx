import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamIssue } from '@/lib/team-builder/validation';

export function ValidationBanner({ issues }: { issues: TeamIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
        Nenhum problema encontrado — time válido para o formato selecionado.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3">
      {issues.map((issue, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-2 text-sm',
            issue.level === 'error' ? 'text-danger' : 'text-warning'
          )}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>{issue.message}</span>
        </div>
      ))}
    </div>
  );
}
