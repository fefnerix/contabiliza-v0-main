import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
    </div>
  );
}

function useOnboardingGate() {
  const { user, isLoading, activationFormSubmitted } = useAppContext();
  const checkingOnboarding = Boolean(user) && activationFormSubmitted === null;
  const needsOnboarding = Boolean(user) && activationFormSubmitted === false;
  const onboardingComplete = Boolean(user) && activationFormSubmitted === true;
  return { user, isLoading, checkingOnboarding, needsOnboarding, onboardingComplete };
}

/** Rotas que exigem sessão e formulário de ativação enviado no banco. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, isLoading, checkingOnboarding, needsOnboarding } = useOnboardingGate();

  if (isLoading || checkingOnboarding) return <AuthLoading />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

/** Login / registro: só visitantes. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, checkingOnboarding, needsOnboarding, onboardingComplete } =
    useOnboardingGate();

  if (isLoading || checkingOnboarding) return <AuthLoading />;
  if (user) {
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    if (onboardingComplete) return <Navigate to="/dashboard" replace />;
    return <AuthLoading />;
  }
  return <>{children}</>;
}

/** Onboarding: só logado sem envio confirmado no banco. */
export function OnboardingRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, checkingOnboarding, needsOnboarding, onboardingComplete } =
    useOnboardingGate();

  if (isLoading || checkingOnboarding) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (onboardingComplete) return <Navigate to="/dashboard" replace />;
  if (!needsOnboarding) return <AuthLoading />;
  return <>{children}</>;
}
