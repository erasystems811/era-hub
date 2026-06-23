import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = parseInt(process.env.PORT ?? '3000', 10)
const DIST = join(__dirname, 'dist')

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
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw
}

createServer(async (req, res) => {
  const urlPath = (req.url ?? '/').split('?')[0].replace(/\.\./g, '')

  // ERA Core proxy — routes all /api/core-proxy requests server-side to avoid browser network blocks
  if (urlPath === '/api/core-proxy') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    if (req.method === 'POST') {
      try {
        const { url, method = 'GET', secret, data } = JSON.parse(await readBody(req))

        if (!url || !url.startsWith('https://')) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid URL' }))
          return
        }

        const headers = { 'Content-Type': 'application/json' }
        if (secret) headers['x-core-secret'] = secret

        const upstream = await fetch(url, {
          method,
          headers,
          body: data !== undefined ? JSON.stringify(data) : undefined,
        })

        const text = await upstream.text()
        res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
        res.end(text)
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Proxy error: ' + e.message }))
      }
      return
    }
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
