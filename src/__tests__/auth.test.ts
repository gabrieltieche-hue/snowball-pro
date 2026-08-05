import { describe, it, expect } from "vitest"
import {
  ACCOUNTS_KEY,
  SESSION_KEY,
  browserStorage,
  changePassword,
  deleteAccount,
  getAccount,
  getSession,
  login,
  logout,
  memoryStorage,
  normalizeEmail,
  register,
  validateEmail,
  validateName,
  validatePassword,
} from "../auth/auth"
import { generateSalt, hashPassword, sha256Hex } from "../auth/hash"
import { SCOPED_BASE_KEYS, scopeKey } from "../auth/storage"

describe("hash — SHA-256 (vecteurs NIST publiés)", () => {
  it("vecteur « abc »", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  })

  it("vecteur « vide »", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
  })

  it("vecteur « hello »", () => {
    expect(sha256Hex("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
  })

  it("déterministe et sensible au sel (jamais deux fois le même hash pour le même mot de passe)", () => {
    const salt = generateSalt()
    expect(hashPassword("secret123", salt)).toBe(hashPassword("secret123", salt))
    expect(hashPassword("secret123", salt)).not.toBe(hashPassword("secret123", generateSalt()))
  })

  it("le séparateur « : » évite l'ambiguïté sel/mot de passe", () => {
    // « ab » + « cdef » ≠ « abc » + « def » — deux couples distincts ne
    // doivent jamais produire le même hash.
    expect(hashPassword("cdef", "ab")).not.toBe(hashPassword("def", "abc"))
  })
})

describe("validation des identifiants", () => {
  it("accepte un email valide, rejette les formats invalides", () => {
    expect(validateEmail("marie@exemple.fr")).toBeNull()
    expect(validateEmail("  marie@exemple.fr  ")).toBeNull()
    expect(validateEmail("marie")).not.toBeNull()
    expect(validateEmail("marie@")).not.toBeNull()
    expect(validateEmail("")).not.toBeNull()
  })

  it("force 8 caractères + lettre + chiffre pour le mot de passe", () => {
    expect(validatePassword("secret12")).toBeNull()
    expect(validatePassword("court1")).not.toBeNull() // < 8
    expect(validatePassword("seulementdeslettres")).not.toBeNull() // sans chiffre
    expect(validatePassword("123456789")).not.toBeNull() // sans lettre
    expect(validatePassword("")).not.toBeNull()
  })

  it("valide le nom", () => {
    expect(validateName("Marie Dupont")).toBeNull()
    expect(validateName("  ")).not.toBeNull()
  })

  it("normalise l'email en minuscules", () => {
    expect(normalizeEmail("  Marie@Exemple.FR ")).toBe("marie@exemple.fr")
  })
})

describe("cycle de vie des comptes (storage mémoire)", () => {
  it("inscrit un compte et ouvre une session persistée", () => {
    const storage = memoryStorage()
    const result = register(storage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.account.email).toBe("marie@exemple.fr")
    // Le mot de passe n'est JAMAIS stocké en clair
    expect(JSON.stringify(storage.getItem(ACCOUNTS_KEY))).not.toContain("secret12")
    // La session est persistée
    expect(getSession(storage)?.userId).toBe(result.account.id)
    expect(getAccount(storage, result.account.id)?.name).toBe("Marie")
  })

  it("refuse un email déjà utilisé (doublon)", () => {
    const storage = memoryStorage()
    register(storage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" })
    const dup = register(storage, { name: "Autre", email: "MARIE@exemple.fr", password: "autre123" })

    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.error).toContain("déjà")
  })

  it("valide les champs avant d'écrire quoi que ce soit", () => {
    const storage = memoryStorage()
    expect(register(storage, { name: "X", email: "pas-un-email", password: "secret12" }).ok).toBe(false)
    expect(register(storage, { name: "X", email: "a@b.fr", password: "faible" }).ok).toBe(false)
    expect(storage.getItem(ACCOUNTS_KEY)).toBeNull()
  })

  it("connecte avec les bons identifiants (email insensible à la casse)", () => {
    const storage = memoryStorage()
    register(storage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" })

    const ok = login(storage, { email: "MARIE@exemple.fr", password: "secret12" })
    expect(ok.ok).toBe(true)

    const wrong = login(storage, { email: "marie@exemple.fr", password: "mauvais12" })
    expect(wrong.ok).toBe(false)

    const unknown = login(storage, { email: "inconnu@exemple.fr", password: "secret12" })
    expect(unknown.ok).toBe(false)
  })

  it("déconnecte : la session disparaît du stockage", () => {
    const storage = memoryStorage()
    register(storage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" })
    expect(getSession(storage)).not.toBeNull()

    logout(storage)
    expect(getSession(storage)).toBeNull()
  })

  it("une session orpheline (compte disparu) est purgée au prochain getSession", () => {
    const storage = memoryStorage()
    register(storage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" })
    expect(getSession(storage)).not.toBeNull()

    // Le compte est supprimé derrière la session (nettoyage externe) : la
    // session doit être invalidée ET purgée — jamais de session fantôme.
    storage.setItem(ACCOUNTS_KEY, "[]")
    expect(getSession(storage)).toBeNull()
    expect(storage.getItem(SESSION_KEY)).toBeNull()
  })

  it("change le mot de passe : l'ancien cesse de fonctionner, le nouveau passe", () => {
    const storage = memoryStorage()
    const { account } = register(storage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" }) as {
      ok: true
      account: { id: string }
    }

    expect(changePassword(storage, { userId: account.id, currentPassword: "faux", newPassword: "nouveau12" }).ok).toBe(
      false,
    )
    expect(
      changePassword(storage, { userId: account.id, currentPassword: "secret12", newPassword: "nouveau12" }).ok,
    ).toBe(true)

    expect(login(storage, { email: "marie@exemple.fr", password: "secret12" }).ok).toBe(false)
    expect(login(storage, { email: "marie@exemple.fr", password: "nouveau12" }).ok).toBe(true)
  })

  it("supprime le compte après vérification du mot de passe", () => {
    const storage = memoryStorage()
    const { account } = register(storage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" }) as {
      ok: true
      account: { id: string }
    }

    expect(deleteAccount(storage, { userId: account.id, password: "mauvais12" }).ok).toBe(false)
    expect(getAccount(storage, account.id)).not.toBeNull()

    expect(deleteAccount(storage, { userId: account.id, password: "secret12" }).ok).toBe(true)
    expect(getAccount(storage, account.id)).toBeNull()
    expect(getSession(storage)).toBeNull()
  })

  it("browserStorage survit à un stockage indisponible (mode privé, quota)", () => {
    // Simule un localStorage qui lève (proxy) : l'auth ne doit pas crasher.
    const boom = {
      getItem: () => {
        throw new Error("SecurityError")
      },
      setItem: () => {
        throw new Error("QuotaExceededError")
      },
      removeItem: () => {
        throw new Error("SecurityError")
      },
    } as unknown as Storage
    const original = globalThis.localStorage
    Object.defineProperty(globalThis, "localStorage", { value: boom, configurable: true })
    try {
      expect(browserStorage.getItem("k")).toBeNull()
      expect(() => browserStorage.setItem("k", "v")).not.toThrow()
      expect(() => browserStorage.removeItem("k")).not.toThrow()
    } finally {
      Object.defineProperty(globalThis, "localStorage", { value: original, configurable: true })
    }
  })
})

describe("scoping du stockage par compte", () => {
  it("l'invité garde les clés historiques (rétrocompatibilité v5)", () => {
    for (const base of SCOPED_BASE_KEYS) {
      expect(scopeKey(null, base)).toBe(base)
    }
  })

  it("un compte reçoit des clés préfixées u:<id>:", () => {
    expect(scopeKey("abc123", "snowball_v5_settings")).toBe("u:abc123:snowball_v5_settings")
    expect(scopeKey("abc123", "snowball_v5_snapshots")).toBe("u:abc123:snowball_v5_snapshots")
    expect(scopeKey("abc123", "snowball_v5_settings_b")).toBe("u:abc123:snowball_v5_settings_b")
  })

  it("deux comptes ne partagent jamais la même clé", () => {
    expect(scopeKey("a", "snowball_v5_settings")).not.toBe(scopeKey("b", "snowball_v5_settings"))
  })
})
