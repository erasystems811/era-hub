const store = new Map<string, { v: unknown; at: number }>()
const TTL = 90_000

export const pageCache = {
  get: <T>(k: string): T | null => {
    const e = store.get(k)
    if (!e || Date.now() - e.at > TTL) { store.delete(k); return null }
    return e.v as T
  },
  set: <T>(k: string, v: T) => store.set(k, { v, at: Date.now() }),
  bust: (prefix?: string) => {
    if (!prefix) return store.clear()
    for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k)
  },
}
