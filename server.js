import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = parseInt(process.env.PORT ?? '3000', 10)
const DIST = join(__dirname, 'dist')
const ERA_CORE = (process.env.ERA_CORE_URL ?? 'https://era-core-production.up.railway.app').replace(/\/$/, '')

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.webp':  'image/webp',
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

createServer(async (req, res) => {
  const rawUrl = req.url ?? '/'
  const urlPath = rawUrl.split('?')[0].replace(/\.\./g, '')

  // Proxy /api/core/* -> ERA Core (server-side, bypasses browser network restrictions)
  if (urlPath.startsWith('/api/core')) {
    const corePath = urlPath.replace('/api/core', '') || '/'
    const query = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : ''
    const target = `${ERA_CORE}${corePath}${query}`

    try {
      const headers = {}
      if (req.headers['content-type'])  headers['content-type']  = req.headers['content-type']
      if (req.headers['x-core-secret']) headers['x-core-secret'] = req.headers['x-core-secret']

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
      const body = hasBody ? await readBody(req) : undefined

      const upstream = await fetch(target, { method: req.method, headers, body })
      const text = await upstream.text()
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
      res.end(text)
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Proxy error: ' + e.message }))
    }
    return
  }

  // Static file serving
  const filePath = join(DIST, urlPath)

  let isFile = false
  try { isFile = (await stat(filePath)).isFile() } catch { /* not found */ }

  const target = isFile ? filePath : join(DIST, 'index.html')
  const mime = MIME[extname(target).toLowerCase()] ?? 'application/octet-stream'
  const cache = isFile ? 'public, max-age=31536000, immutable' : 'no-cache'

  try {
    const data = await readFile(target)
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cache })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`ERA Hub running on port ${PORT}`)
})
