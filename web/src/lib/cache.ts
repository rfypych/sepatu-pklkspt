// Cache in-memory + sessionStorage untuk navigasi instan tanpa loading spinner
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function getCache<T>(key: string, maxAgeMs = 300000): T | null {
  // 1. Cek memory cache
  const mem = memoryCache.get(key)
  if (mem) {
    if (Date.now() - mem.timestamp <= maxAgeMs) {
      return mem.data as T
    }
  }

  // 2. Cek sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`sp_cache_${key}`)
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw)
        if (Date.now() - parsed.timestamp <= maxAgeMs) {
          memoryCache.set(key, parsed)
          return parsed.data
        }
      }
    } catch {
      // Abaikan error parse
    }
  }

  return null
}

export function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() }
  memoryCache.set(key, entry)

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`sp_cache_${key}`, JSON.stringify(entry))
    } catch {
      // Quota exceeded atau storage tidak aktif
    }
  }
}

export function invalidateCache(...patterns: string[]): void {
  // Hapus memory cache
  for (const key of memoryCache.keys()) {
    if (patterns.some((p) => key.includes(p))) {
      memoryCache.delete(key)
    }
  }

  // Hapus sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith('sp_cache_')) {
          const subKey = k.replace('sp_cache_', '')
          if (patterns.some((p) => subKey.includes(p))) {
            keysToRemove.push(k)
          }
        }
      }
      for (const k of keysToRemove) {
        sessionStorage.removeItem(k)
      }
    } catch {
      // Abaikan
    }
  }
}

export function clearAllCache(): void {
  memoryCache.clear()
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith('sp_cache_')) {
          keysToRemove.push(k)
        }
      }
      for (const k of keysToRemove) {
        sessionStorage.removeItem(k)
      }
    } catch {
      // Abaikan
    }
  }
}
