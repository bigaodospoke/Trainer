'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { TeraSpinner } from '@/components/ui/tera-spinner';

export default function SignInClient() {
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
    <main className="flex min-h-screen items-center-justify-center px-6">
      <GlassCard padding="lg" className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <TeraSpinner size={48} />
        </div>

        <h1 className="mb-2 font-display text-xl font-semibold text-ink-primary">
          Entrar no Trainerly
        </h1>

        <p className="mb-6 text-sm text-ink-muted">
          O login é feito exclusivamente via Discord — sem senha para gerenciar.
        </p>

        <Button
          className="w-full"
          size="lg"
          onClick={() => signIn('discord', { callbackUrl })}
        >
          Entrar com Discord
        </Button>
      </GlassCard>
    </main>
  );
}