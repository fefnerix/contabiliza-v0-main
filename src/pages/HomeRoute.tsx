import { Navigate } from "react-router-dom";
import { OnboardingSplash } from "@/components/OnboardingSplash";
import { useAppContext } from "@/contexts/AppContext";
import { isOnboardingDone } from "@/utils/onboarding";

export default function HomeRoute() {
  const { user, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (!isOnboardingDone()) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingSplash />;
}
