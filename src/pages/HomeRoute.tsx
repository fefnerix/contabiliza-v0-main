import { Navigate } from "react-router-dom";
import { OnboardingSplash } from "@/components/OnboardingSplash";
import { useAppContext } from "@/contexts/AppContext";

export default function HomeRoute() {
  const { user, isLoading, activationFormSubmitted } = useAppContext();

  if (isLoading || (user && activationFormSubmitted === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (!activationFormSubmitted) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingSplash />;
}
