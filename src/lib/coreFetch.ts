import { getCoreApi, getCoreSecret } from './config'

type Method = 'GET' | 'POST' | 'DELETE'

function getBase(): string {
  // In dev: call ERA Core directly. In production: route through /api/core proxy.
  return import.meta.env.DEV ? getCoreApi() : '/api/core'
}

export async function coreFetch<T = unknown>(
  path: string,
  opts: { method?: Method; body?: unknown } = {}
): Promise<T> {
  const method = opts.method ?? 'GET'
  const secret = getCoreSecret()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['x-core-secret'] = secret

  const res = await fetch(`${getBase()}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status}${text ? ': ' + text : ''}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
