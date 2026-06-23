import { getCoreApi, getCoreSecret } from './config'

type Method = 'GET' | 'POST' | 'DELETE'

async function doFetch(url: string, method: Method, secret?: string, data?: unknown): Promise<Response> {
  // In dev mode use direct fetch; in production route through server-side proxy
  // to avoid browser cross-origin / network blocks
  if (import.meta.env.DEV) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (secret) headers['x-core-secret'] = secret
    return fetch(url, {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  return fetch('/api/core-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method, secret, data }),
  })
}

export async function coreFetch<T = unknown>(
  path: string,
  opts: { method?: Method; body?: unknown; url?: string; secret?: string } = {}
): Promise<T> {
  const url = opts.url ?? `${getCoreApi()}${path}`
  const secret = opts.secret ?? getCoreSecret()
  const method = opts.method ?? 'GET'

  const res = await doFetch(url, method, secret, opts.body)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status}${text ? ': ' + text : ''}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
