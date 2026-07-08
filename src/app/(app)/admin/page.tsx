import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Users, Flag, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { banUser, resolveReport, dismissReport } from './actions';

export default async function AdminPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/dashboard');

  const [userCount, teamCount, reportCount, syncLogs, openReports, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.syncLog.findMany({ orderBy: { startedAt: 'desc' }, take: 5 }),
    prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { reporter: { select: { username: true } } },
    }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  const syncStatusTone = (status: string) =>
    status === 'SUCCESS' ? 'success' : status === 'FAILED' ? 'danger' : 'warning';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <h1 className="font-display text-2xl font-semibold text-ink-primary">Administração</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <GlassCard padding="md"><Users className="mb-2 h-5 w-5 text-purple-neon" /><p className="font-mono text-2xl text-ink-primary">{userCount}</p><p className="text-xs text-ink-muted">Usuários</p></GlassCard>
        <GlassCard padding="md"><ShieldCheck className="mb-2 h-5 w-5 text-purple-neon" /><p className="font-mono text-2xl text-ink-primary">{teamCount}</p><p className="text-xs text-ink-muted">Times</p></GlassCard>
        <GlassCard padding="md"><Flag className="mb-2 h-5 w-5 text-danger" /><p className="font-mono text-2xl text-ink-primary">{reportCount}</p><p className="text-xs text-ink-muted">Denúncias abertas</p></GlassCard>
      </div>

      <GlassCard padding="lg">
        <div className="mb-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-purple-neon" />
          <h2 className="font-display text-sm font-semibold text-ink-primary">Status dos syncs</h2>
        </div>
        <div className="flex flex-col gap-2">
          {syncLogs.length === 0 && <p className="text-xs text-ink-dim">Nenhum sync executado ainda.</p>}
          {syncLogs.map((log: (typeof syncLogs)[number]) => (
            <div key={log.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
              <Badge tone={syncStatusTone(log.status) as 'success' | 'danger' | 'warning'}>{log.status}</Badge>
              <span className="text-sm text-ink-primary">{log.source}</span>
              <span className="flex-1 text-xs text-ink-dim">{log.recordsProcessed} registros</span>
              <span className="text-xs text-ink-dim">{log.startedAt.toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">Denúncias abertas</h2>
        <div className="flex flex-col gap-2">
          {openReports.length === 0 && <p className="text-xs text-ink-dim">Nenhuma denúncia aberta.</p>}
          {openReports.map((report: (typeof openReports)[number]) => (
            <div key={report.id} className="flex flex-wrap items-start gap-3 rounded-lg bg-white/5 px-3 py-2">
              <div className="flex-1">
                <p className="text-xs text-ink-dim">
                  @{report.reporter.username} · {report.targetType} · {report.createdAt.toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-ink-primary">{report.reason}</p>
              </div>
              <div className="flex gap-2">
                <form action={resolveReport.bind(null, report.id)}>
                  <Button type="submit" size="sm" variant="secondary">Resolver</Button>
                </form>
                <form action={dismissReport.bind(null, report.id)}>
                  <Button type="submit" size="sm" variant="ghost">Descartar</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink-primary">Usuários recentes</h2>
        <div className="flex flex-col gap-1">
          {recentUsers.map((u: (typeof recentUsers)[number]) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <Avatar src={u.avatarUrl} name={u.displayName ?? u.username} size={24} />
              <Link href={`/profile/${u.username}`} className="flex-1 text-sm text-ink-primary hover:underline">@{u.username}</Link>
              <Badge tone={u.role === 'ADMIN' ? 'danger' : u.isBanned ? 'warning' : 'neutral'}>{u.role}</Badge>
              {!u.isBanned && u.role !== 'ADMIN' && (
                <form action={banUser.bind(null, u.id)}>
                  <Button type="submit" size="sm" variant="danger">Ban</Button>
                </form>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
