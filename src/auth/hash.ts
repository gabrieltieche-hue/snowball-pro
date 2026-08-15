/**
 * Hachage — SHA-256 (FIPS 180-4) implémenté en JS pur.
 *
 * Pourquoi pas WebCrypto ? `crypto.subtle` n'existe pas dans jsdom (tests
 * composants) et rend le flux d'inscription asynchrone partout. Cette
 * implémentation est synchrone, déterministe et vérifiée par des vecteurs de
 * test publiés (NIST) — suffisante pour du stockage 100 % local (les données
 * ne quittent jamais l'appareil, cf. bandeau DisclaimerBar).
 *
 * Limite assumée et documentée : un hachage salé unique par compte, pas de
 * PBKDF2/Argon2 ni de côté serveur. Le jour où un vrai backend arrive, cette
 * couche est le seul endroit à remplacer (contrat `hashPassword` inchangé).
 */

// Constantes du tour SHA-256 (NIST FIPS 180-4, §4.2.2)
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
  0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
  0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2,
]

// Vecteurs d'initialisation (NIST, §5.3.3)
const H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]

const rotr = (x: number, n: number): number => ((x >>> n) | (x << (32 - n))) >>> 0

/** SHA-256 d'une chaîne UTF-8, en hexadécimal minuscule. */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const bitLenHi = Math.floor(bytes.length / 0x20000000) // hauts 32 bits du bit-length
  const bitLenLo = bytes.length * 8

  // Padding : 0x80 + zéros + longueur sur 64 bits (big-endian), bloc de 64 o
  const paddedLen = (((bytes.length + 8) >> 6) + 1) * 64
  const padded = new Uint8Array(paddedLen)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLen - 8, bitLenHi)
  view.setUint32(paddedLen - 4, bitLenLo)

  const h = [...H0]
  const w = new Uint32Array(64)

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4)
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, hh] = h
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (hh + S1 + ch + K[i] + w[i]) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0
      hh = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h[0] = (h[0] + a) >>> 0
    h[1] = (h[1] + b) >>> 0
    h[2] = (h[2] + c) >>> 0
    h[3] = (h[3] + d) >>> 0
    h[4] = (h[4] + e) >>> 0
    h[5] = (h[5] + f) >>> 0
    h[6] = (h[6] + g) >>> 0
    h[7] = (h[7] + hh) >>> 0
  }

  return h.map(x => x.toString(16).padStart(8, "0")).join("")
}

/** 16 octets aléatoires en hexadécimal (crypto.getRandomValues, repli Math.random). */
export function generateRandomHex(bytes = 16): string {
  const out = new Uint8Array(bytes)
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    cryptoObj.getRandomValues(out)
  } else {
    for (let i = 0; i < bytes; i++) out[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(out, b => b.toString(16).padStart(2, "0")).join("")
}

/** Sel aléatoire pour un compte (stocké en clair, n'est pas un secret). */
export function generateSalt(): string {
  return generateRandomHex(16)
}

/** Jeton de session / identifiant de compte (secret côté navigateur). */
export function generateToken(): string {
  return generateRandomHex(16)
}

/**
 * Hache un mot de passe avec son sel. Le séparateur « : » évite l'ambiguïté
 * sel/mot de passe (« abc » + « def » ≠ « ab » + « cdef »).
 */
export function hashPassword(password: string, salt: string): string {
  return sha256Hex(`${salt}:${password}`)
}
