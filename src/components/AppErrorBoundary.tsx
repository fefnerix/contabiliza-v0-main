import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary:", error, info.componentStack);
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
          Estamos com dificuldades técnicas. Tente novamente em alguns minutos.
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
}
