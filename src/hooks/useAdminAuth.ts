import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  id: string;
  email: string;
  name?: string;
}

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      try {
        setIsLoading(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          if (!cancelled) {
            setIsAdmin(false);
            setAdminUser(null);
            setIsLoading(false);
          }
          return;
        }

        const { data: roleData, error: roleError } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!cancelled) {
          const adminStatus = !roleError && roleData?.role === "admin";
          setIsAdmin(adminStatus);

          if (adminStatus) {
            const { data: userData } = await (supabase as any)
              .from("poupeja_users")
              .select("id, name, email")
              .eq("id", session.user.id)
              .single();

            setAdminUser(
              userData || {
                id: session.user.id,
                email: session.user.email || "",
              },
            );
          } else {
            setAdminUser(null);
          }

          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setAdminUser(null);
          setIsLoading(false);
        }
      }
    };

    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        if (!cancelled) {
          setIsAdmin(false);
          setAdminUser(null);
          setIsLoading(false);
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkAdmin();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, adminUser };
}

