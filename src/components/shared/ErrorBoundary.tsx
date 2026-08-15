import { Component, type ErrorInfo, type ReactNode } from "react"
import { RefreshCw, TriangleAlert } from "lucide-react"
import { useLang } from "../../i18n"

interface ErrorBoundaryProps {
  children: ReactNode
  label?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

function ErrorFallback({ label, message }: { label?: string; message: string }) {
  const { tr } = useLang()
  return (
    <div role="alert" className="glass rounded-3xl p-8 text-center border border-danger/40 bg-danger/10">
      <div className="mb-3 flex justify-center">
        <TriangleAlert size={40} className="text-danger" aria-hidden />
      </div>
      <h2 className="text-sm font-bold text-text mb-1">
        {label ? tr("Une erreur est survenue dans « {label} »", { label }) : tr("Une erreur est survenue")}
      </h2>
      <p className="text-xs text-text-muted leading-relaxed max-w-md mx-auto mb-4">
        {tr(
          "L'application a rencontré un problème imprévu dans cette zone. Rechargez pour repartir sur de bonnes bases — vos réglages sont enregistrés sur cet appareil.",
        )}
      </p>
      {message && <p className="text-[11px] mono text-danger/80 mb-4 break-words max-w-sm mx-auto">{message}</p>}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn-shine inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-primary-light btn-gold-text shadow-gold hover:from-primary-light hover:to-primary transition-all"
      >
        <RefreshCw size={13} aria-hidden /> {tr("Recharger")}
      </button>
    </div>
  )
}

/**
 * Garde-fou par onglet : une erreur de rendu (ex. un graphe Recharts) ne doit
 * jamais faire tomber toute l'application. Affiche un message (traduit, v6.12)
 * avec un bouton de rechargement ciblé.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback label={this.props.label} message={this.state.message} />
    }
    return this.props.children
  }
}
