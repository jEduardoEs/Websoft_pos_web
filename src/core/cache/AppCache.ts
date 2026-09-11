// Enterprise Memory Cache Utility for WebSoft POS
// Golden Rule: NO EMOJIS anywhere in code or comments.

interface CacheEntry<T> {
  data: T;
  expires: number;
}

export class AppCache {
  private static store = new Map<string, CacheEntry<any>>();

  /**
   * Retrieves item from cache or executes loader and stores result with TTL.
   */
  static async get<T>(key: string, loader: () => Promise<T>, ttlMs: number = 30000): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && entry.expires > now) {
      return entry.data;
    }

    const data = await loader();
    this.store.set(key, { data, expires: now + ttlMs });
    return data;
  }

  /**
   * Invalidates a specific key or keys matching pattern.
   */
  static invalidate(pattern: string | RegExp): void {
    if (typeof pattern === 'string') {
      this.store.delete(pattern);
      return;
    }

    for (const key of this.store.keys()) {
      if (pattern.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Flushes all cached entries.
   */
  static clear(): void {
    this.store.clear();
  }
}
