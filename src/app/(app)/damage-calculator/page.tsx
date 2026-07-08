import { Calculator } from 'lucide-react';
import { DamageCalculator } from '@/components/damage-calculator/calculator';

export default function DamageCalculatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-purple-neon" strokeWidth={1.75} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Damage Calculator</h1>
          <p className="text-sm text-ink-muted">
            Calculado com <code>@smogon/calc</code> — o mesmo motor do calculador oficial do Showdown.
          </p>
        </div>
      </div>

      <DamageCalculator />
    </div>
  );
}
