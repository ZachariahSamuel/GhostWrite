// Generates maskable PWA icons: Casper centred on the brand background with a
// safe-zone margin. Outputs public/icon-192.png and public/icon-512.png.
const sharp = require('sharp')

async function make(size) {
  const pad = Math.round(size * 0.18)        // maskable safe-zone padding
  const inner = size - pad * 2
  const ghost = await sharp('public/casper-mark.png')
    .resize(inner, inner, { fit: 'inside' })
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: '#0D0D16' } })
    .composite([{ input: ghost, gravity: 'center' }])
    .png()
    .toFile(`public/icon-${size}.png`)
  console.log(`icon-${size}.png`)
}

;(async () => { await make(512); await make(192) })()
  .catch(e => { console.error(e); process.exit(1) })
