import { useState } from "react"
import type { FormEvent } from "react"
import { UserPlus } from "lucide-react"
import { browserStorage, register } from "../../auth/auth"
import { syncSession } from "../../auth/store"
import { useLang } from "../../i18n"
import { navigateTo } from "../../router"
import { TextField } from "./fields"

/**
 * Inscription — validation par champ (nom, email, force du mot de passe,
 * confirmation), erreur doublon inline, session ouverte puis route #/app.
 */
export function RegisterForm() {
  const { tr } = useLang()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = tr("Votre nom est requis.")
    if (!email.trim()) next.email = tr("L'adresse email est requise.")
    if (password.length < 8) next.password = tr("Au moins 8 caractères.")
    if (confirm !== password) next.confirm = tr("Les deux mots de passe ne correspondent pas.")
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setGeneralError(null)
    const result = register(browserStorage, { name, email, password })
    if (!result.ok) {
      // L'erreur peut porter sur l'email (doublon) ou la force du mot de passe.
      setErrors(prev => ({ ...prev, email: result.error.includes("email") ? tr(result.error) : undefined }))
      setGeneralError(result.error.includes("email") ? null : tr(result.error))
      return
    }
    syncSession()
    navigateTo("app")
  }

  const passwordHint =
    password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password) ? (
      <span className="text-success">{tr("Mot de passe solide ✓")}</span>
    ) : (
      <>{tr("8 caractères minimum, avec une lettre et un chiffre")}</>
    )

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        id="register-name"
        label={tr("Votre nom")}
        value={name}
        onChange={setName}
        placeholder={tr("Ex. Marie Dupont")}
        autoComplete="name"
        error={errors.name}
        maxLength={60}
      />
      <TextField
        id="register-email"
        label={tr("Adresse email")}
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="vous@exemple.fr"
        autoComplete="email"
        error={errors.email}
      />
      <TextField
        id="register-password"
        label={tr("Mot de passe")}
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        error={errors.password}
        hint={passwordHint}
        maxLength={128}
      />
      <TextField
        id="register-confirm"
        label={tr("Confirmer le mot de passe")}
        type="password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        error={errors.confirm}
        maxLength={128}
      />

      {generalError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[11px] font-semibold text-danger flex items-center gap-2"
        >
          <UserPlus size={12} className="shrink-0" aria-hidden />
          {generalError}
        </div>
      )}

      <button
        type="submit"
        className="w-full btn-shine rounded-xl bg-primary btn-gold-text font-extrabold text-sm py-3 shadow-gold transition-all duration-150 active:scale-[0.98] hover:brightness-110"
      >
        {tr("Créer mon compte")}
      </button>

      <p className="text-[11px] text-text-muted text-center">
        {tr("Déjà un compte ?")}{" "}
        <button
          type="button"
          onClick={() => navigateTo("login")}
          className="font-bold text-primary hover:underline underline-offset-2"
        >
          {tr("Se connecter")}
        </button>
      </p>
    </form>
  )
}
