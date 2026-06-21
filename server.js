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

createServer(async (req, res) => {
  const urlPath = (req.url ?? '/').split('?')[0].replace(/\.\./g, '')
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
