// Génère public/icon-192.png et public/icon-512.png (PNG RGBA, zlib natif Node).
// Usage : node scripts/generate-icons.mjs
import { deflateSync, crc32 } from "node:zlib"
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, "ascii")
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0)
  return Buffer.concat([length, typeBuf, data, crcBuf])
}

function inRoundedRect(x, y, size, radius) {
  const dx = Math.max(radius - x, x - (size - 1 - radius), 0)
  const dy = Math.max(radius - y, y - (size - 1 - radius), 0)
  return dx * dx + dy * dy <= radius * radius
}

function pixel(x, y, size) {
  const radius = Math.round(size * 0.22)
  if (!inRoundedRect(x, y, size, radius)) return [0, 0, 0, 0]

  const cx = size / 2
  const cy = size * 0.52
  const r = size * 0.3
  const dx = x - cx
  const dy = y - cy
  const inBall = dx * dx + dy * dy <= r * r

  // Ombre douce sous la boule
  const sdy = y - (cy + size * 0.06)
  if (!inBall && dx * dx + sdy * sdy <= r * r * 1.04) return [0x0a, 0x09, 0x08, 190]

  if (inBall) {
    // Reflet en haut à gauche
    const hx = cx - r * 0.42
    const hy = cy - r * 0.42
    const hdx = x - hx
    const hdy = y - hy
    if (hdx * hdx + hdy * hdy <= (r * 0.3) ** 2) return [0xe8, 0xcd, 0x7a, 255]
    // Dégradé doré (plus sombre vers le bas)
    const t = Math.min(1, Math.max(0, (y - (cy - r)) / (2 * r)))
    return [Math.round(0xd4 - 0x12 * t), Math.round(0xb4 - 0x1c * t), 0x37, 255]
  }

  return [0x12, 0x10, 0x0e, 255]
}

function makeIcon(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let offset = 0
  const ss = 4 // sur-échantillonnage 2x2
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // filtre None
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const [pr, pg, pb, pa] = pixel(x * 2 + sx, y * 2 + sy, size * 2)
          r += pr
          g += pg
          b += pb
          a += pa
        }
      }
      raw[offset++] = r / ss
      raw[offset++] = g / ss
      raw[offset++] = b / ss
      raw[offset++] = a / ss
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const idat = deflateSync(raw)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const png = makeIcon(size)
  writeFileSync(join(root, "public", `icon-${size}.png`), png)
  console.log(`public/icon-${size}.png → ${png.length} octets`)
}
