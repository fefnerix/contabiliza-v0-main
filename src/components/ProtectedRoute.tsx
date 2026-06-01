import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { isOnboardingDone } from "@/utils/onboarding";

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
    </div>
  );
}

/** Rotas que exigem sessão (e onboarding concluído). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAppContext();
  const location = useLocation();

  if (isLoading) return <AuthLoading />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (!isOnboardingDone()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

/** Login / registro: só visitantes. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAppContext();

  if (isLoading) return <AuthLoading />;
  if (user) {
    if (!isOnboardingDone()) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

/** Onboarding: só logado e ainda sem flag. */
export function OnboardingRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAppContext();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (isOnboardingDone()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
