import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  label?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

/**
 * Garde-fou par onglet : une erreur de rendu (ex. un graphe Recharts) ne doit
 * jamais faire tomber toute l'application. Affiche un message en français avec
 * un bouton de rechargement ciblé.
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
      return (
        <div role="alert" className="glass rounded-3xl p-8 text-center border border-danger/40 bg-danger/10">
          <div className="text-4xl mb-3">😵</div>
          <h2 className="text-sm font-bold text-text mb-1">
            Une erreur est survenue{this.props.label ? ` dans « ${this.props.label} »` : ""}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed max-w-md mx-auto mb-4">
            L'application a rencontré un problème imprévu dans cette zone. Rechargez pour repartir sur de bonnes bases —
            vos réglages sont enregistrés sur cet appareil.
          </p>
          {this.state.message && (
            <p className="text-[11px] mono text-danger/80 mb-4 break-words max-w-sm mx-auto">{this.state.message}</p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-primary-light btn-gold-text shadow-gold hover:from-primary-light hover:to-primary transition-all"
          >
            🔄 Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
