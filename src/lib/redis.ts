import Redis from 'ioredis';

/**
 * Cliente Redis compartilhado, usado para:
 *  - cache de leitura "quente" (analises de time, leaderboards, resultados
 *    de busca da Pokedex/Meta Analyzer)
 *  - fila de sincronizacao (BullMQ usa o mesmo Redis como broker — fase 2)
 *
 * Ver docs/ARCHITECTURE.md > "Estrategia de Cache" para a politica de TTL
 * por tipo de chave.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/** Helper de cache "ler ou calcular" com TTL em segundos. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // Redis indisponivel nao deve derrubar a request — apenas pula o cache.
  }

  const value = await compute();

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // idem
  }

  return value;
}
