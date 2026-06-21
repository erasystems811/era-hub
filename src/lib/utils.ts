export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(d))
}

export function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))
}

export function fmtMoney(kobo: number | null | undefined) {
  if (kobo == null) return '—'
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtNumber(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('en')
}

export function timeAgo(d: string | null | undefined) {
  if (!d) return 'never'
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return fmtDate(d)
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
