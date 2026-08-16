/**
 * PAGES PUBLIQUES (SEO) — non-régression v6.14.
 *
 * Les pages statiques de `public/` (guides, alternatives, pricing) portent
 * chacune un CTA « Simulez votre scénario » en lien profond `/#s=…` : si un
 * payload devenait indécodable (champ renommé, base64 cassé), le bouton
 * ouvrirait l'app avec les défauts au lieu du scénario annoncé — pire qu'un
 * lien mort. Ce test fige la promesse : chaque `#s=` des pages publiques doit
 * être décodé par le même chemin que l'app (`decodeInputsFromUrl` →
 * `parseStoredInputs`), avec les champs clés du scénario annoncé préservés.
 *
 * Il vérifie aussi la cohérence de la distribution : chaque URL du sitemap et
 * de `llms.txt` doit correspondre à un fichier réellement servi.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { decodeInputsFromUrl } from "../utils/urlState"
import type { SimulationInputs } from "../types"

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const PUBLIC_DIR = join(ROOT_DIR, "public")

const HASH_RE = /#(s=[A-Za-z0-9+/=_-]+)/g
const SITE_URL = "https://snowball-pro.vercel.app"

/** Toutes les pages statiques HTML du dossier public (hors app SPA). */
function staticPages(): string[] {
  const pages: string[] = []
  for (const dir of ["guides", "alternatives"]) {
    for (const file of readdirSync(join(PUBLIC_DIR, dir))) {
      if (file.endsWith(".html")) pages.push(`${dir}/${file}`)
    }
  }
  if (existsSync(join(PUBLIC_DIR, "pricing.html"))) pages.push("pricing.html")
  return pages.sort()
}

/** Extraire les payloads `#s=…` d'une page (le hash n'est jamais encodé en HTML). */
function extractHashes(page: string): string[] {
  const html = readFileSync(join(PUBLIC_DIR, page), "utf8")
  return [...html.matchAll(HASH_RE)].map(m => m[1])
}

function urlToFile(url: string): string {
  const pathname = new URL(url).pathname.replace(/^\//, "")
  return pathname === "" ? "index.html" : pathname
}

/** L'index de l'app SPA vit à la racine (Vite), pas dans public/. */
function fileExists(rel: string): boolean {
  return existsSync(join(PUBLIC_DIR, rel)) || existsSync(join(ROOT_DIR, rel))
}

describe("Pages publiques — CTA deep-links décodables par le moteur", () => {
  const pages = staticPages()
  expect(pages.length).toBeGreaterThan(0)

  it.each(pages)("%s : chaque lien #s= se décode via decodeInputsFromUrl", page => {
    const hashes = extractHashes(page)
    expect(hashes.length).toBeGreaterThan(0)
    for (const hash of hashes) {
      const inputs = decodeInputsFromUrl(hash)
      expect(inputs, `payload indécodable : ${hash}`).not.toBeNull()
    }
  })

  it("les scénarios annoncés par les CTA gardent leurs champs clés", () => {
    const byPage = Object.fromEntries(pages.map(page => [page, extractHashes(page)]))
    const first = (page: string) => {
      const inputs = decodeInputsFromUrl(byPage[page][0])
      expect(inputs, `payload indécodable sur ${page}`).not.toBeNull()
      return inputs as SimulationInputs
    }

    // Guides : épargne en PEA / AV pré-remplie.
    expect(first("guides/simulateur-pea.html").envelope).toBe("pea")
    expect(first("guides/pea-ou-assurance-vie.html").envelope).toBe("pea")
    expect(first("guides/calcul-interets-composes.html").envelope).toBe("pea")
    expect(first("guides/simulateur-pea.html").capitalInitial).toBeGreaterThan(0)

    // Alternatives : le scénario annoncé dans le CTA est bien celui appliqué.
    const pv = first("alternatives/portfolio-visualizer.html")
    expect(pv.capitalInitial).toBe(100000)
    expect(pv.monthlyPayment).toBe(1500)
    const fire = first("alternatives/firecalc.html")
    expect(fire.withdrawalModel).toBe("rule-4")
    expect(fire.withdrawalRate).toBeCloseTo(0.04)
    const nw = first("alternatives/networthify.html")
    expect(nw.goalTarget).toBe(1_000_000)
    const ql = first("alternatives/quantalys.html")
    expect(ql.envelope).toBe("av")
    expect(ql.capitalInitial).toBe(50000)

    // Pricing : même scénario PEA que la landing.
    expect(first("pricing.html").capitalInitial).toBe(100000)
  })
})

describe("Distribution — sitemap.xml et llms.txt pointent vers des fichiers existants", () => {
  const sitemap = readFileSync(join(PUBLIC_DIR, "sitemap.xml"), "utf8")
  const llms = readFileSync(join(PUBLIC_DIR, "llms.txt"), "utf8")

  it("chaque URL du sitemap correspond à un fichier du dossier public", () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    expect(locs.length).toBeGreaterThan(0)
    for (const loc of locs) {
      expect(loc.startsWith(`${SITE_URL}/`)).toBe(true)
      const file = urlToFile(loc)
      expect(fileExists(file), `${file} manquant (sitemap)`).toBe(true)
    }
  })

  it("chaque lien de llms.txt correspond à un fichier du dossier public", () => {
    const links = [...llms.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1])
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      if (!link.startsWith(SITE_URL)) continue
      const file = urlToFile(link)
      expect(fileExists(file), `${file} manquant (llms.txt)`).toBe(true)
    }
  })

  it("le sitemap couvre toutes les pages statiques publiées", () => {
    const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => urlToFile(m[1])))
    for (const page of staticPages()) {
      expect(locs.has(page), `${page} absent du sitemap`).toBe(true)
    }
  })
})
