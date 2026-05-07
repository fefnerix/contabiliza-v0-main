import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  return <>{children}</>;
}
