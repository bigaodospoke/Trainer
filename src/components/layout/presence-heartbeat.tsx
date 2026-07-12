'use client';

import { useEffect } from 'react';
import { touchPresence } from '@/lib/friends/presence-actions';

const HEARTBEAT_MS = 60_000;

/** Sem UI — so mantem User.lastActiveAt atualizado enquanto a aba estiver
 *  aberta e visivel, pra status online/ausente/offline de amigos funcionar. */
export function PresenceHeartbeat() {
  useEffect(() => {
    touchPresence();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') touchPresence();
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
