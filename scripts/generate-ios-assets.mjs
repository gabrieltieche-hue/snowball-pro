// Génère les assets iOS natifs (App Store) à partir de la même identité que
// les icônes web (boule dorée sur fond #12100e) :
//   - AppIcon 1024×1024 (sans transparence ni coins arrondis : iOS masque lui-même)
//   - Splash 2732×2732 (fond sombre plein + boule centrée, scaleAspectFill)
// Usage : node scripts/generate-ios-assets.mjs
import { deflateSync, crc32 } from "node:zlib"
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const APP_ICON_PATH = join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
const SPLASH_DIR = join(root, "ios/App/App/Assets.xcassets/Splash.imageset")

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, "ascii")
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0)
  return Buffer.concat([length, typeBuf, data, crcBuf])
}

const BG = [0x12, 0x10, 0x0e] // #12100e
const BALL_TOP = [0xe8, 0xcd, 0x7a] // reflet
const BALL_BASE = [0xd4, 0xb4, 0x37] // dégradé or (haut → bas)

/**
 * Boule dorée centrée (même géométrie que scripts/generate-icons.mjs, sans le
 * masque arrondi ni la transparence). `ss` = sur-échantillonnage (2×2 lisse,
 * 1× rapide pour le splash où l'aliasing est invisible).
 */
function makeBallImage(size, ss) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let offset = 0
  const cx = size / 2
  const cy = size * 0.52
  const r = size * 0.3
  const r2 = r * r
  const reflectX = cx - r * 0.42
  const reflectY = cy - r * 0.42
  const reflectR2 = (r * 0.3) ** 2

  const sample = (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const inBall = dx * dx + dy * dy <= r2
    if (inBall) {
      // Reflet en haut à gauche
      const hdx = x - reflectX
      const hdy = y - reflectY
      if (hdx * hdx + hdy * hdy <= reflectR2) return BALL_TOP
      const t = Math.min(1, Math.max(0, (y - (cy - r)) / (2 * r)))
      return [Math.round(BALL_BASE[0] - 0x12 * t), Math.round(BALL_BASE[1] - 0x1c * t), Math.round(BALL_BASE[2])]
    }
    return BG
  }

  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // filtre None
    for (let x = 0; x < size; x++) {
      if (ss === 1) {
        const [r_, g, b] = sample(x, y)
        raw[offset++] = r_
        raw[offset++] = g
        raw[offset++] = b
        raw[offset++] = 255
      } else {
        let r = 0
        let g = 0
        let b = 0
        for (let sy = 0; sy < 2; sy++) {
          for (let sx = 0; sx < 2; sx++) {
            const [pr, pg, pb] = sample(x * 2 + sx, y * 2 + sy)
            r += pr
            g += pg
            b += pb
          }
        }
        raw[offset++] = r / 4
        raw[offset++] = g / 4
        raw[offset++] = b / 4
        raw[offset++] = 255
      }
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

// AppIcon 1024×1024 — 2×2 lissé (icône visible sur l'écran d'accueil).
const appIcon = makeBallImage(1024, 2)
writeFileSync(APP_ICON_PATH, appIcon)
console.log(`AppIcon 1024×1024 → ${APP_ICON_PATH} (${appIcon.length} octets)`)

// Splash 2732×2732 — 1× (image d'accueil, aliasing invisible, génération ~10×
// plus rapide que 2×2 sur 7,5 Mpx). Boule centrée à 30 % du rayon : le centre
// de l'image n'est jamais rogné par scaleAspectFill (même en paysage).
const splash = makeBallImage(2732, 1)
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  writeFileSync(join(SPLASH_DIR, name), splash)
}
console.log(`Splash 2732×2732 → ${SPLASH_DIR} (3 fichiers, ${splash.length} octets)`)
