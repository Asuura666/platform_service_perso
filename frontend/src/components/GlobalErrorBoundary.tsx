import { Component, type ErrorInfo, type ReactNode, useCallback } from 'react'
import { useNotifications } from '@/providers/NotificationProvider'

type InnerBoundaryProps = {
  fallback: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
  children: ReactNode
}

type InnerBoundaryState = {
  hasError: boolean
}

class InnerErrorBoundary extends Component<InnerBoundaryProps, InnerBoundaryState> {
  state: InnerBoundaryState = { hasError: false }

  static getDerivedStateFromError(): InnerBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

const GlobalErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { push } = useNotifications()

  const handleError = useCallback(
    (error: Error, info: ErrorInfo) => {
      const message = error.message || "Une erreur inattendue s'est produite."
      push({ type: 'error', message, duration: 0 })
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Captured by GlobalErrorBoundary:', error, info)
      }
    },
    [push],
  )

  const fallback = (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-red-500/40 bg-red-900/30 px-6 py-12 text-center text-red-100">
      <h2 className="text-2xl font-semibold">Oups, une erreur inattendue est survenue.</h2>
      <p className="max-w-md text-sm text-red-100/80">
        Essayez de recharger la page. Si le probleme persiste, contactez l&apos;equipe technique.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-2xl bg-gradient-to-r from-red-500 to-red-400 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-red-500/20"
      >
        Recharger la page
      </button>
    </div>
  )

  return (
    <InnerErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </InnerErrorBoundary>
  )
}

export default GlobalErrorBoundary
