import React from "react";

interface SupabaseInitializerProps {
  children: React.ReactNode;
}

/** Mantido como wrapper estável na árvore; o client exige env válida antes do bootstrap. */
export const SupabaseInitializer: React.FC<SupabaseInitializerProps> = ({ children }) => {
  return <>{children}</>;
};
