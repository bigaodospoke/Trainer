'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { TeraSpinner } from '@/components/ui/tera-spinner';

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInCard />
    </Suspense>
  );
}

function SignInCard() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <GlassCard padding="lg" className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <TeraSpinner size={48} />
        </div>
        <h1 className="mb-2 font-display text-xl font-semibold text-ink-primary">
          Entrar no Trainerly
        </h1>
        <p className="mb-6 text-sm text-ink-muted">
          O login e feito exclusivamente via Discord — sem senha para gerenciar.
        </p>
        <Button className="w-full" size="lg" onClick={() => signIn('discord', { callbackUrl })}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.073.035c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.07.07 0 0 0-.073-.035 19.736 19.736 0 0 0-4.885 1.515.064.064 0 0 0-.03.026C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.073.073 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028" />
          </svg>
          Entrar com Discord
        </Button>
      </GlassCard>
    </main>
  );
}
