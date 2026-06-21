const http = require('http')
const fs = require('fs')
const path = require('path')

const DIST = path.join(__dirname, 'dist')
const PORT = parseInt(process.env.PORT || '3000', 10)

const TYPES = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.css':   'text/css',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.json':  'application/json',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0].replace(/\.\./g, '')
  let filePath = path.join(DIST, urlPath)

  try {
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) filePath = path.join(DIST, 'index.html')
  } catch {
    filePath = path.join(DIST, 'index.html')
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = TYPES[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return }
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  })
}).listen(PORT, '0.0.0.0', () => {
  console.log(`ERA Hub running on 0.0.0.0:${PORT}`)
})
