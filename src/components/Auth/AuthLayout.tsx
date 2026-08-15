import type { ReactNode } from "react"
import { ArrowLeft, Wallet } from "lucide-react"
import { useLang } from "../../i18n"
import { navigateTo } from "../../router"

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

/**
 * Coquille des écrans de connexion/inscription : en-tête avec la marque
 * (même emblème or que l'app), carte glass centrée, note de confidentialité.
 */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { tr } = useLang()
  return (
    <div className="min-h-screen bg-surface text-text flex flex-col">
      <h1 className="sr-only">{title}</h1>

      <header className="border-b border-border/70 backdrop-blur-xl bg-surface/72">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center shadow-gold">
              <Wallet size={18} className="btn-gold-text" aria-hidden />
              <span className="absolute -inset-px rounded-xl ring-1 ring-primary/50" aria-hidden />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-extrabold tracking-tight">
                SNOWBALL <span className="text-primary">PRO</span>
              </div>
              <div className="text-[10px] text-text-dim uppercase tracking-[0.22em]">
                {tr("Simulateur patrimonial")}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo("landing")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors"
          >
            <ArrowLeft size={12} aria-hidden /> {tr("Retour à l'accueil")}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass rounded-3xl p-6 sm:p-8 shadow-premium relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(120% 80% at 50% -20%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-text">{title}</h2>
              <p className="text-xs text-text-muted mt-1.5">{subtitle}</p>
              <div className="mt-6">{children}</div>
            </div>
          </div>
          <p className="text-[10.5px] text-text-dim text-center mt-4 leading-relaxed px-2">
            {tr("Vos identifiants et vos simulations restent")}{" "}
            <strong className="text-text-muted">{tr("sur cet appareil")}</strong> —{" "}
            {tr("aucune donnée n'est envoyée sur un serveur.")}
          </p>
        </div>
      </main>
    </div>
  )
}
