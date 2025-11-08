/**
 * Cache Infrastructure
 *
 * Provides in-memory caching with TTL support for expensive database queries.
 * Uses a singleton pattern to ensure consistent cache state across the application.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * CacheManager class provides in-memory caching with automatic TTL expiration.
 * Entries are automatically cleaned up when accessed after expiration.
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupIntervalId: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupIntervalId = null;
    this.startCleanup();
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a specific cache entry
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all cache entries matching a prefix
   * @param prefix Key prefix to match
   */
  deleteByPrefix(prefix: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Start automatic cleanup of expired entries
   * Runs every 5 minutes
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Remove all expired entries from cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());

    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval (for cleanup/testing)
   */
  stopCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null;

/**
 * Get the singleton cache manager instance
 */
export function getCacheManager(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

/**
 * Generate a deterministic cache key from parameters
 * @param prefix Key prefix (e.g., "platform", "tutor", "student")
 * @param params Object containing parameters to include in key
 * @returns Deterministic cache key string
 *
 * @example
 * generateCacheKey("platform", { metric: "health", start: "2024-01-01", end: "2024-01-31" })
 * // Returns: "platform:health:2024-01-01:2024-01-31"
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedKeys = Object.keys(params).sort();
  const parts = [prefix];

  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null) {
      // Convert dates to ISO strings for consistency
      if (value instanceof Date) {
        parts.push(value.toISOString());
      } else if (typeof value === 'object') {
        // For objects, stringify and hash
        parts.push(JSON.stringify(value));
      } else {
        parts.push(String(value));
      }
    }
  }

  return parts.join(':');
}

/**
 * Cache wrapper function - fetches from cache or executes function and caches result
 * @param key Cache key
 * @param ttlSeconds Time to live in seconds
 * @param fetchFn Function to execute if cache miss
 * @returns Cached or freshly fetched value
 *
 * @example
 * const data = await withCache(
 *   "platform:health:2024-01-01",
 *   300, // 5 minutes
 *   async () => await calculateHealthMetrics()
 * );
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cache = getCacheManager();

  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss - execute function
  try {
    const result = await fetchFn();
    cache.set(key, result, ttlSeconds);
    return result;
  } catch (error) {
    // Don't cache errors - let them propagate
    throw error;
  }
}

/**
 * Cache key prefixes for different domains
 */
export const CACHE_PREFIXES = {
  PLATFORM: 'platform',
  TUTOR: 'tutor',
  STUDENT: 'student',
  SESSION: 'session',
  CHURN: 'churn',
  ALERT: 'alert',
  INSIGHT: 'insight'
} as const;

/**
 * Standard TTL values in seconds
 */
export const CACHE_TTL = {
  SHORT: 5 * 60,        // 5 minutes
  MEDIUM: 15 * 60,      // 15 minutes
  LONG: 30 * 60,        // 30 minutes
  VERY_LONG: 60 * 60    // 1 hour
} as const;
