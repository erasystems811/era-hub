import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/08 p-8 max-w-lg mx-auto mt-8 text-center">
          <p className="font-semibold text-red-400 mb-1">Something went wrong</p>
          <p className="text-xs text-muted-foreground font-mono break-all">{this.state.error.message}</p>
          <button className="btn-secondary mt-4 text-sm" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
