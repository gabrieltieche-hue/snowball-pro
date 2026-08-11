import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { ChevronDown, KeyRound, LogOut, Trash2, User, UserPlus } from "lucide-react"
import { browserStorage, changePassword, deleteAccount, getAccount, logout } from "../../auth/auth"
import { removeScopedData } from "../../auth/storage"
import { syncSession, useSession } from "../../auth/store"
import { navigateTo } from "../../router"
import { cn } from "../../utils/cn"
import { TextField } from "./fields"

type Panel = "menu" | "password" | "delete"

const itemClass =
  "w-full text-left inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors hover:bg-glass-hover"

/**
 * Menu de compte de l'en-tête — invité : « Se connecter » ; connecté : avatar
 * (initiales) + nom, avec déconnexion, changement de mot de passe et
 * suppression du compte (double confirmation + mot de passe). Fermeture au
 * clic extérieur et à Échap.
 */
export function AccountMenu() {
  const session = useSession()
  const account = session ? getAccount(browserStorage, session.userId) : null
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>("menu")
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    setPanel("menu")
  }

  const handleLogout = () => {
    logout(browserStorage)
    syncSession()
    close()
  }

  const handleDeleteAccount = (password: string): { ok: boolean; error?: string } => {
    if (!session) return { ok: false }
    const result = deleteAccount(browserStorage, { userId: session.userId, password })
    if (!result.ok) return result
    removeScopedData(session.userId)
    syncSession()
    close()
    navigateTo("landing")
    return { ok: true }
  }

  const initials = account
    ? account.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? "")
        .join("")
    : ""

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setPanel("menu")
          setOpen(o => !o)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={account ? `Compte de ${account.name}` : "Compte invité — se connecter"}
        className={cn(
          "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-150 active:scale-[0.97]",
          open ? "glass-gold border border-primary/40" : "glass hover:bg-glass-hover",
        )}
      >
        {account ? (
          <>
            <span
              aria-hidden
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center btn-gold-text text-[10px] font-extrabold shadow-gold"
            >
              {initials || "?"}
            </span>
            <span className="max-w-[110px] truncate hidden sm:block">{account.name.split(" ")[0]}</span>
          </>
        ) : (
          <>
            <User size={13} className="text-primary" aria-hidden />
            <span>Se connecter</span>
          </>
        )}
        <ChevronDown size={12} aria-hidden className={cn("text-text-dim transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        // role="menu" uniquement pour le panneau d'actions : les panneaux
        // mot de passe / suppression contiennent des formulaires — ARIA invalide
        // dans un menu (revue adverse v6.1).
        <div
          role={panel === "menu" ? "menu" : undefined}
          aria-label={panel === "menu" ? "Menu du compte" : undefined}
          className="absolute right-0 top-[calc(100%+8px)] w-72 glass-strong rounded-2xl shadow-premium-lg p-2 z-50 animate-scale-in"
        >
          {panel === "menu" && !account && (
            <div className="p-2 space-y-1">
              <p className="text-[10px] text-text-dim px-3 pt-1 pb-2 leading-relaxed">
                Compte invité — vos simulations restent sur cet appareil. Créer un compte ne transfère rien en ligne :
                il crée des espaces de simulation séparés et protégés par mot de passe, pour plusieurs projets sur le
                même appareil.
              </p>
              <button type="button" role="menuitem" className={itemClass} onClick={() => navigateTo("login")}>
                <User size={13} className="text-primary" aria-hidden /> Se connecter
              </button>
              <button type="button" role="menuitem" className={itemClass} onClick={() => navigateTo("register")}>
                <UserPlus size={13} className="text-primary" aria-hidden /> Créer un compte
              </button>
            </div>
          )}

          {panel === "menu" && account && (
            <div className="p-2 space-y-1">
              <div className="px-3 pt-1 pb-2 border-b border-border/70 mb-1">
                <p className="text-[11.5px] font-bold text-text truncate">{account.name}</p>
                <p className="text-[10px] text-text-dim truncate">{account.email}</p>
              </div>
              <button type="button" role="menuitem" className={itemClass} onClick={() => setPanel("password")}>
                <KeyRound size={13} className="text-primary" aria-hidden /> Changer le mot de passe
              </button>
              <button type="button" role="menuitem" className={itemClass} onClick={handleLogout}>
                <LogOut size={13} className="text-primary" aria-hidden /> Se déconnecter
              </button>
              <div className="border-t border-border/70 pt-1 mt-1">
                <button
                  type="button"
                  role="menuitem"
                  className={cn(itemClass, "text-danger hover:bg-danger/10")}
                  onClick={() => setPanel("delete")}
                >
                  <Trash2 size={13} aria-hidden /> Supprimer mon compte
                </button>
              </div>
            </div>
          )}

          {panel === "password" && account && (
            <PasswordPanel accountName={account.name} onClose={close} onBack={() => setPanel("menu")} />
          )}
          {panel === "delete" && account && (
            <DeletePanel accountName={account.name} onConfirm={handleDeleteAccount} onBack={() => setPanel("menu")} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Panneaux internes ───────────────────────────────────────────────────────

function PanelShell({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-text">{title}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] font-bold text-text-muted hover:text-text transition-colors"
        >
          ← Retour
        </button>
      </div>
      {children}
    </div>
  )
}

function PasswordPanel({
  accountName,
  onClose,
  onBack,
}: {
  accountName: string
  onClose: () => void
  onBack: () => void
}) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const session = useSession()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (next !== confirm) {
      setError("Les deux nouveaux mots de passe ne correspondent pas.")
      return
    }
    if (!session) return
    const result = changePassword(browserStorage, {
      userId: session.userId,
      currentPassword: current,
      newPassword: next,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <PanelShell title="Mot de passe" onBack={onClose}>
        <p className="text-xs text-success font-semibold">Mot de passe modifié ✓</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-primary btn-gold-text font-extrabold text-xs py-2.5 shadow-gold transition-all active:scale-[0.98]"
        >
          Fermer
        </button>
      </PanelShell>
    )
  }

  return (
    <PanelShell title="Changer le mot de passe" onBack={onBack}>
      <p className="text-[10.5px] text-text-dim leading-relaxed">Compte de {accountName}</p>
      <form onSubmit={submit} noValidate className="space-y-3">
        <TextField
          id="pw-current"
          label="Mot de passe actuel"
          type="password"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          autoFocus
          maxLength={128}
        />
        <TextField
          id="pw-new"
          label="Nouveau mot de passe"
          type="password"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          hint="8 caractères minimum, avec une lettre et un chiffre"
          maxLength={128}
        />
        <TextField
          id="pw-confirm"
          label="Confirmer"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          maxLength={128}
        />
        {error && (
          <p role="alert" className="text-[11px] font-semibold text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-primary btn-gold-text font-extrabold text-xs py-2.5 shadow-gold transition-all active:scale-[0.98]"
        >
          Mettre à jour
        </button>
      </form>
    </PanelShell>
  )
}

function DeletePanel({
  accountName,
  onConfirm,
  onBack,
}: {
  accountName: string
  onConfirm: (password: string) => { ok: boolean; error?: string }
  onBack: () => void
}) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [confirmStep, setConfirmStep] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length === 0) {
      setError("Saisissez votre mot de passe pour confirmer.")
      return
    }
    const result = onConfirm(password)
    if (!result.ok && result.error) setError(result.error)
  }

  return (
    <PanelShell title="Supprimer le compte" onBack={onBack}>
      {!confirmStep ? (
        <>
          <p className="text-[10.5px] text-danger leading-relaxed border border-danger/30 bg-danger/10 rounded-xl px-3 py-2.5">
            <strong>{accountName}</strong> et toutes ses simulations sur cet appareil seront définitivement supprimés.
            Cette action est irréversible.
          </p>
          <button
            type="button"
            onClick={() => setConfirmStep(true)}
            className="w-full rounded-xl bg-danger/15 border border-danger/40 text-danger font-extrabold text-xs py-2.5 transition-all active:scale-[0.98]"
          >
            Je comprends, continuer
          </button>
        </>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-3">
          <TextField
            id="delete-password"
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            autoFocus
            error={error}
            maxLength={128}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-danger text-white font-extrabold text-xs py-2.5 transition-all active:scale-[0.98] hover:brightness-110"
          >
            Supprimer définitivement
          </button>
        </form>
      )}
    </PanelShell>
  )
}
