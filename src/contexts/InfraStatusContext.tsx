import { createContext, useContext, type ReactNode } from "react";
import { useInfraStatus } from "@/hooks/useInfraStatus";

type InfraCtx = ReturnType<typeof useInfraStatus>;

const InfraStatusContext = createContext<InfraCtx | null>(null);

/** Um único ciclo de health-check para sidebar + painel de infraestrutura. */
export function InfraStatusProvider({ children }: { children: ReactNode }) {
  const infra = useInfraStatus({ refreshMs: 120_000 });
  return <InfraStatusContext.Provider value={infra}>{children}</InfraStatusContext.Provider>;
}

export function useInfraStatusContext() {
  const ctx = useContext(InfraStatusContext);
  if (!ctx) throw new Error("useInfraStatusContext must be used within InfraStatusProvider");
  return ctx;
}
