/**
 * Comptes & sessions — logique pure, storage injectable (testable en node
 * comme en jsdom, utilisable dans le navigateur via `browserStorage`).
 *
 * Contrat de sécurité : les mots de passe ne sont JAMAIS stockés en clair —
 * uniquement `sha256(salt:password)` (voir hash.ts). Les comptes vivent dans
 * localStorage sous `snowball_v6_accounts`, la session sous
 * `snowball_v6_session`. Aucune donnée ne quitte l'appareil (100 % local).
 */
import { generateSalt, generateToken, hashPassword } from "./hash"

export interface UserAccount {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  createdAt: number
}

export interface AuthSession {
  userId: string
  token: string
  createdAt: number
}

/** Contrat de stockage minimal — `browserStorage` en prod, mémoire dans les tests. */
export interface AuthStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const ACCOUNTS_KEY = "snowball_v6_accounts"
export const SESSION_KEY = "snowball_v6_session"

/** Adapter localStorage (tolérant aux quotas / modes privés). */
export const browserStorage: AuthStorage = {
  getItem: key => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* quota ou stockage indisponible — l'auth reste en mémoire pour la session */
    }
  },
  removeItem: key => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* idem */
    }
  },
}

/** Storage mémoire (tests unitaires). */
export function memoryStorage(): AuthStorage {
  const map = new Map<string, string>()
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: key => {
      map.delete(key)
    },
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Normalise un email : minuscules + espaces retirés (unicité des comptes). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Renvoie un message d'erreur, ou null si l'email est valide. */
export function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'adresse email est requise."
  if (email.length > 254) return "Cette adresse email est trop longue."
  if (!EMAIL_RE.test(email.trim())) return "Adresse email invalide (ex. nom@domaine.fr)."
  return null
}

/** Renvoie un message d'erreur, ou null si le mot de passe est valide. */
export function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis."
  if (password.length < 8) return "Au moins 8 caractères."
  if (password.length > 128) return "128 caractères maximum."
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Au moins une lettre et un chiffre."
  return null
}

/** Renvoie un message d'erreur, ou null si le nom est valide. */
export function validateName(name: string): string | null {
  if (!name.trim()) return "Votre nom est requis."
  if (name.trim().length > 60) return "60 caractères maximum."
  return null
}

// ─── Accès aux données ───────────────────────────────────────────────────────

function readAccounts(storage: AuthStorage): UserAccount[] {
  const raw = storage.getItem(ACCOUNTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as UserAccount[]) : []
  } catch {
    return []
  }
}

function writeAccounts(storage: AuthStorage, accounts: UserAccount[]): void {
  storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function findAccount(accounts: UserAccount[], email: string): UserAccount | null {
  const normalized = normalizeEmail(email)
  return accounts.find(a => a.email === normalized) ?? null
}

export function getAccount(storage: AuthStorage, userId: string): UserAccount | null {
  return readAccounts(storage).find(a => a.id === userId) ?? null
}

// ─── Cycle de vie ────────────────────────────────────────────────────────────

export type AuthResult = { ok: true; account: UserAccount; session: AuthSession } | { ok: false; error: string }

interface CredentialsInput {
  name?: string
  email: string
  password: string
}

/** Crée un compte puis ouvre une session (inscription = connexion immédiate). */
export function register(storage: AuthStorage, input: CredentialsInput): AuthResult {
  const nameValue = input.name ?? ""
  const nameError = validateName(nameValue)
  if (nameError) return { ok: false, error: nameError }
  const emailError = validateEmail(input.email)
  if (emailError) return { ok: false, error: emailError }
  const passwordError = validatePassword(input.password)
  if (passwordError) return { ok: false, error: passwordError }

  const accounts = readAccounts(storage)
  if (findAccount(accounts, input.email)) {
    return { ok: false, error: "Un compte existe déjà avec cette adresse email." }
  }

  const salt = generateSalt()
  const account: UserAccount = {
    id: generateToken(),
    name: nameValue.trim(),
    email: normalizeEmail(input.email),
    salt,
    passwordHash: hashPassword(input.password, salt),
    createdAt: Date.now(),
  }
  writeAccounts(storage, [...accounts, account])

  const session: AuthSession = { userId: account.id, token: generateToken(), createdAt: Date.now() }
  storage.setItem(SESSION_KEY, JSON.stringify(session))
  return { ok: true, account, session }
}

/** Ouvre une session si les identifiants sont corrects (message volontairement générique). */
export function login(storage: AuthStorage, input: CredentialsInput): AuthResult {
  const emailError = validateEmail(input.email)
  if (emailError) return { ok: false, error: emailError }
  if (!input.password) return { ok: false, error: "Le mot de passe est requis." }

  const account = findAccount(readAccounts(storage), input.email)
  if (!account || account.passwordHash !== hashPassword(input.password, account.salt)) {
    return { ok: false, error: "Email ou mot de passe incorrect." }
  }

  const session: AuthSession = { userId: account.id, token: generateToken(), createdAt: Date.now() }
  storage.setItem(SESSION_KEY, JSON.stringify(session))
  return { ok: true, account, session }
}

export function logout(storage: AuthStorage): void {
  storage.removeItem(SESSION_KEY)
}

/** Restaure la session persistée ; null si absente, invalide ou compte supprimé. */
export function getSession(storage: AuthStorage): AuthSession | null {
  const raw = storage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as AuthSession
    if (!session || typeof session.userId !== "string") return null
    // Un compte supprimé ailleurs invalide la session (jamais de session orpheline).
    if (!getAccount(storage, session.userId)) {
      storage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

/** Change le mot de passe après vérification de l'actuel. */
export function changePassword(
  storage: AuthStorage,
  input: { userId: string; currentPassword: string; newPassword: string },
): { ok: true } | { ok: false; error: string } {
  const account = getAccount(storage, input.userId)
  if (!account) return { ok: false, error: "Compte introuvable." }
  if (account.passwordHash !== hashPassword(input.currentPassword, account.salt)) {
    return { ok: false, error: "Le mot de passe actuel est incorrect." }
  }
  const passwordError = validatePassword(input.newPassword)
  if (passwordError) return { ok: false, error: passwordError }
  if (input.newPassword === input.currentPassword) {
    return { ok: false, error: "Le nouveau mot de passe doit être différent de l'actuel." }
  }

  const salt = generateSalt()
  const updated: UserAccount = { ...account, salt, passwordHash: hashPassword(input.newPassword, salt) }
  writeAccounts(
    storage,
    readAccounts(storage).map(a => (a.id === account.id ? updated : a)),
  )
  return { ok: true }
}

/** Supprime le compte (vérification du mot de passe) + sa session. */
export function deleteAccount(
  storage: AuthStorage,
  input: { userId: string; password: string },
): { ok: true } | { ok: false; error: string } {
  const account = getAccount(storage, input.userId)
  if (!account) return { ok: false, error: "Compte introuvable." }
  if (account.passwordHash !== hashPassword(input.password, account.salt)) {
    return { ok: false, error: "Le mot de passe est incorrect." }
  }
  writeAccounts(
    storage,
    readAccounts(storage).filter(a => a.id !== account.id),
  )
  storage.removeItem(SESSION_KEY)
  return { ok: true }
}
