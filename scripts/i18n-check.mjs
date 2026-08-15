/**
 * Vérifie que chaque clé utilisée par les composants (appels tr("…") et
 * libellés français passés en props) existe dans le dictionnaire anglais de
 * src/engine/i18n.ts. Usage : node scripts/i18n-check.mjs
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const dict = fs.readFileSync(path.join(ROOT, "src/engine/i18n.ts"), "utf8")
const dictBlock = dict.slice(dict.indexOf("const EN"), dict.indexOf("export function interpolate"))

// Les clés sont soit entre guillemets ("Durée"), soit des identifiants nus
// (Année: — Prettier retire les guillemets quand la clé est un identifiant
// valide). On construit l'ensemble des clés du dictionnaire pour tester
// l'appartenance, au lieu d'une recherche de chaîne fragile.
const keyRe = /^\s*(?:"((?:[^"\\]|\\.)*)"|([\p{L}\p{N}_$][\p{L}\p{N}_$]*))\s*:/gmu
const dictKeys = new Set()
{
  let m
  while ((m = keyRe.exec(dictBlock))) dictKeys.add(m[1] ?? m[2])
}

function walk(dir) {
  let out = []
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) out = out.concat(walk(p))
    else if (/\.tsx?$/.test(f) && !p.includes("__tests__")) out.push(p)
  }
  return out
}

const files = walk(path.join(ROOT, "src"))

// Faux positifs volontaires : dataKeys de graphiques, libellé de langue qui
// reste en français (« Français »), titre document (géré par applyLangToDocument),
// erreur fatale #root, données moteur non affichées (sources taxRules).
const ALLOWED = new Set([
  "impôts", // EquityChart dataKey
  "réel", // PatrimonialReport dataKey
  "médian", // RenteRetraiteTab dataKey
  "Français", // LANGS label
  "PFU = 12,8 % IR + 17,2 % prélèvements sociaux = 30 %", // taxRules sources
  "AV exclue : prélèvements sociaux maintenus à 17,2 %", // taxRules sources
  "Snowball Pro — Simulateur patrimonial français gratuit", // document.title FR
  "Élément #root introuvable", // erreur fatale
])

const re1 = /tr\(\s*"((?:[^"\\]|\\.)*)"/g
const re2 = /"((?:[^"\\]|\\.)*[àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇœ][^"\\]*)"/g
let missing = 0

for (const f of files) {
  const src = fs.readFileSync(f, "utf8")
  const keys = new Set()
  let m
  while ((m = re1.exec(src))) {
    if (m[1] !== "fr" && m[1] !== "en") keys.add(m[1])
  }
  while ((m = re2.exec(src))) {
    const k = m[1]
    if (k.length < 300 && !k.includes("\n") && !k.includes("{") && !k.includes("(") && !k.includes('"')) keys.add(k)
  }
  for (const k of keys) {
    if (!dictKeys.has(k) && !ALLOWED.has(k)) {
      missing++
      console.log("  MISSING:", f, JSON.stringify(k))
    }
  }
}
console.log("total missing:", missing)
process.exit(missing > 0 ? 1 : 0)
