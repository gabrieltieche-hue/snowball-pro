import { useState } from "react"
import type { FormEvent } from "react"
import { LockKeyhole } from "lucide-react"
import { browserStorage, login } from "../../auth/auth"
import { syncSession } from "../../auth/store"
import { navigateTo } from "../../router"
import { TextField } from "./fields"

/** Connexion — erreurs inline en français, session persistée puis route #/app. */
export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const result = login(browserStorage, { email, password })
    if (!result.ok) {
      setError(result.error)
      return
    }
    syncSession()
    navigateTo("app")
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        id="login-email"
        label="Adresse email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="vous@exemple.fr"
        autoComplete="email"
        autoFocus
      />
      <TextField
        id="login-password"
        label="Mot de passe"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Votre mot de passe"
        autoComplete="current-password"
        maxLength={128}
      />

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[11px] font-semibold text-danger flex items-center gap-2"
        >
          <LockKeyhole size={12} className="shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full btn-shine rounded-xl bg-primary btn-gold-text font-extrabold text-sm py-3 shadow-gold transition-all duration-150 active:scale-[0.98] hover:brightness-110"
      >
        Se connecter
      </button>

      <p className="text-[11px] text-text-muted text-center">
        Pas encore de compte ?{" "}
        <button
          type="button"
          onClick={() => navigateTo("register")}
          className="font-bold text-primary hover:underline underline-offset-2"
        >
          Créer un compte
        </button>
      </p>
    </form>
  )
}
