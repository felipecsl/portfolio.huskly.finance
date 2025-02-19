interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const CACHE_DURATION = 5 * 60; // 5 minutes in seconds

export async function cacheFetch<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  expirationInSeconds: number = CACHE_DURATION,
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached) return Promise.resolve(cached);

  try {
    const result = await fetchFunction();
    return cacheSet(key, result, expirationInSeconds);
  } catch (error) {
    console.error("Cache fetch error:", error);
    throw error;
  }
}

export function cacheGet<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Math.floor(Date.now() / 1000);

    if (now >= entry.expiresAt) {
      cacheRemove(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

export function cacheSet<T>(
  key: string,
  data: T,
  expirationInSeconds: number = CACHE_DURATION,
): T {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Math.floor(Date.now() / 1000) + expirationInSeconds,
    };
    localStorage.setItem(key, JSON.stringify(entry));
    return data;
  } catch (error) {
    console.error("Cache set error:", error);
    return data;
  }
}

export function cacheRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Cache remove error:", error);
  }
}

export async function clearCache(): Promise<void> {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Cache clear error:", error);
  }
}
