import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { monitoring } from "@/lib/monitoring";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null };

/**
 * Production error boundary. Captures unhandled render errors anywhere in
 * the NEXUS shell, logs them, and offers a recovery action without blanking
 * the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    monitoring.captureException(error, {
      source: "nexus.ErrorBoundary",
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-sm font-mono tracking-[0.2em] uppercase text-red-300">
            Módulo interrumpido
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {this.state.error.message || "Error inesperado en este panel."}
          </p>
          <button
            onClick={this.reset}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-mono tracking-[0.15em] uppercase hover:bg-primary/90 transition"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }
}
