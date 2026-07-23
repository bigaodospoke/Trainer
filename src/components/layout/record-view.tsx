'use client';

import { useEffect } from 'react';
import { recordRecentView } from '@/lib/recent-views/actions';

/** Sem UI — so registra "visualizei isso" pro Recently Viewed do Dashboard,
 *  local (localStorage, exibicao instantanea sem round-trip) e na conta
 *  (banco, via server action, persiste entre dispositivos). */
const LOCAL_KEY = 'trainerly-recent-views';
const LOCAL_CAP = 15;

export interface LocalRecentView {
  targetType: 'POKEMON' | 'TEAM';
  targetId: string;
  label: string;
  href: string;
  viewedAt: number;
}

export function RecordView({ targetType, targetId, label, href }: { targetType: 'POKEMON' | 'TEAM'; targetId: string; label: string; href: string }) {
  useEffect(() => {
    recordRecentView(targetType, targetId);
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const list: LocalRecentView[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((v) => !(v.targetType === targetType && v.targetId === targetId));
      filtered.unshift({ targetType, targetId, label, href, viewedAt: Date.now() });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered.slice(0, LOCAL_CAP)));
    } catch {
      // localStorage indisponivel — a versao "na conta" (banco) ja cobre o essencial
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  return null;
}
