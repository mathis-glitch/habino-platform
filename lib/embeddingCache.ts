/**
 * In-memory LRU cache for query embeddings.
 * Avoids redundant OpenAI calls for repeated/similar queries.
 *
 * TTL: 1 hour, Max entries: 500
 */

interface CacheEntry {
  embedding: number[];
  timestamp: number;
}

const MAX_ENTRIES = 500;
const TTL_MS = 60 * 60 * 1000; // 1 hour

const cache = new Map<string, CacheEntry>();

/** Normalize query for caching (lowercase, trim, collapse whitespace). */
function normalizeKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Get a cached embedding, or null if expired / not found. */
export function getCachedEmbedding(query: string): number[] | null {
  const key = normalizeKey(query);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.embedding;
}

/** Store an embedding in the cache. Evicts oldest entry if full. */
export function setCachedEmbedding(query: string, embedding: number[]): void {
  const key = normalizeKey(query);

  // Evict oldest if at capacity
  if (cache.size >= MAX_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestTs = Infinity;
    for (const [k, v] of cache) {
      if (v.timestamp < oldestTs) {
        oldestTs = v.timestamp;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, { embedding, timestamp: Date.now() });
}

/** Cache stats for monitoring. */
export function cacheStats(): { size: number; maxEntries: number } {
  return { size: cache.size, maxEntries: MAX_ENTRIES };
}
