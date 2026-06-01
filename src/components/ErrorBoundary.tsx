import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Captura erros de renderização (ex.: falha ao usar o client Supabase na árvore React).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <img
          src="/pwa-icons/icon-192x192.png"
          alt="Contabiliza"
          width={80}
          height={80}
          className="mb-6 rounded-2xl shadow-sm"
        />
        <p className="text-muted-foreground max-w-md mb-6">
          Estamos con dificultades técnicas.
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Intentar de nuevo
        </Button>
      </div>
    );
  }
}
