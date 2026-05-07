import { supabase } from "@/integrations/supabase/client";

type AuditPayload = {
  action: string;
  target_type?: string;
  target_id?: string | null;
  details?: Record<string, unknown>;
  ip_address?: string | null;
};

export async function logAdminAudit(payload: AuditPayload) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const adminId = auth?.user?.id ?? null;
    await (supabase as any).from("poupeja_admin_audit").insert({
      admin_id: adminId,
      action: payload.action,
      target_type: payload.target_type ?? null,
      target_id: payload.target_id ?? null,
      details: payload.details ?? {},
      ip_address: payload.ip_address ?? null,
    });
  } catch {
    // Não bloquear ação principal se auditoria falhar
  }
}

