// Keys out ONLY the outer black field of public/casper.jpg via a corner flood-fill,
// preserving interior detail (eyes, smile, pen, dissolving particles). Feathers the
// rim for a clean edge. Outputs public/casper.png (transparent).
const sharp = require('sharp')

const SRC = 'public/casper.jpg'
const OUT = 'public/casper.png'
const T = 52          // background darkness threshold (max channel < T => background)
const FEATHER_HI = 130 // rim feather upper bound

;(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const N = width * height
  const bright = i => Math.max(data[i], data[i + 1], data[i + 2])
  const visited = new Uint8Array(N)          // 1 = flooded background
  const stack = []

  // seed every border pixel
  for (let x = 0; x < width; x++) { stack.push(x, 0); stack.push(x, height - 1) }
  for (let y = 0; y < height; y++) { stack.push(0, y); stack.push(width - 1, y) }

  // flood fill the connected dark background
  while (stack.length) {
    const y = stack.pop(), x = stack.pop()
    if (x < 0 || y < 0 || x >= width || y >= height) continue
    const p = y * width + x
    if (visited[p]) continue
    if (bright(p * channels) >= T) continue   // reached the ghost — stop
    visited[p] = 1
    data[p * channels + 3] = 0                 // make transparent
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }

  // feather: soften opaque rim pixels that border the transparent field
  const isClear = (x, y) => x >= 0 && y >= 0 && x < width && y < height && visited[y * width + x]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x
      if (visited[p]) continue
      if (isClear(x + 1, y) || isClear(x - 1, y) || isClear(x, y + 1) || isClear(x, y - 1)) {
        const b = bright(p * channels)
        if (b < FEATHER_HI) {
          const a = Math.max(0, Math.min(255, Math.round(((b - T) / (FEATHER_HI - T)) * 255)))
          data[p * channels + 3] = a
        }
      }
    }
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(OUT)
  const cleared = visited.reduce((a, v) => a + v, 0)
  console.log(`wrote ${OUT} (${width}x${height}) — ${Math.round((cleared / N) * 100)}% keyed transparent`)
})().catch(e => { console.error(e); process.exit(1) })
