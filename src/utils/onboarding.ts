import { supabase } from "@/integrations/supabase/client";
import { hasActivationFormSubmitted } from "@/services/activationFormService";

/** Formulário de ativação pós-login. `false` = fluxo Login → Dashboard. */
export const ACTIVATION_FORM_ENABLED = false;

export function isActivationFormEnabled(): boolean {
  return ACTIVATION_FORM_ENABLED;
}

/** Destino após login/registro quando o formulário está desativado. */
export function getPostAuthPath(redirectTo?: string | null): string {
  if (redirectTo && redirectTo !== "/login" && redirectTo !== "/register" && redirectTo !== "/onboarding") {
    return redirectTo;
  }
  return "/dashboard";
}

/** Cache opcional — NUNCA é fonte de verdade sozinho. */
export const ONBOARDING_DONE_KEY = "contabiliza_onboarding_done";

function isFormDataComplete(formData: unknown): boolean {
  if (!formData || typeof formData !== "object") return false;
  const fd = formData as Record<string, unknown>;
  const keys = Object.keys(fd);
  return (
    keys.length >= 20 &&
    Boolean(fd.fullName && fd.whatsapp && fd.contabilizaCommitment)
  );
}

/** Quem preencheu o form mas o submit falhou (só rascunho): marca submitted_at no login. */
async function repairStuckActivationForm(userId: string): Promise<boolean> {
  const { data, error: readError } = await supabase
    .from("poupeja_activation_forms")
    .select("form_data, submitted_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError || !data || data.submitted_at) {
    return Boolean(data?.submitted_at);
  }
  if (!isFormDataComplete(data.form_data)) return false;

  const submittedAt = new Date().toISOString();
  const formData =
    typeof data.form_data === "object" && data.form_data !== null
      ? { ...(data.form_data as Record<string, unknown>), submittedAt }
      : { submittedAt };

  const { error: updateError } = await supabase
    .from("poupeja_activation_forms")
    .update({
      submitted_at: submittedAt,
      updated_at: submittedAt,
      form_data: formData,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.warn("repairStuckActivationForm", updateError);
    return false;
  }
  return true;
}

async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("poupeja_subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("hasActiveSubscription", error);
    return false;
  }
  if (!data) return false;
  if (data.status !== "active") return false;
  if (!data.current_period_end) return true;
  return new Date(data.current_period_end) > new Date();
}

async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  return !error && Boolean(data);
}

/**
 * Pode usar o app (dashboard): formulário enviado, rascunho completo reparado,
 * assinatura ativa ou admin.
 */
export async function isUserOnboardingComplete(userId: string): Promise<boolean> {
  if (!ACTIVATION_FORM_ENABLED) return true;
  if (await hasActivationFormSubmitted(userId)) return true;
  if (await repairStuckActivationForm(userId)) return true;
  if (await isAdminUser(userId)) return true;
  if (await hasActiveSubscription(userId)) return true;
  return false;
}

/** Fonte de verdade para liberar rotas do app. */
export async function syncOnboardingStatusFromDb(userId: string): Promise<boolean> {
  if (!ACTIVATION_FORM_ENABLED) {
    markOnboardingDoneCache();
    return true;
  }
  try {
    const complete = await isUserOnboardingComplete(userId);
    if (complete) {
      markOnboardingDoneCache();
      return true;
    }
    clearOnboardingDoneCache();
    return false;
  } catch (e) {
    console.error("syncOnboardingStatusFromDb", e);
    return isOnboardingDone();
  }
}

/** Formulário de ativação enviado (admin / relatórios). */
export async function isActivationFormSubmittedInDb(userId: string): Promise<boolean> {
  if (!ACTIVATION_FORM_ENABLED) return true;
  if (await hasActivationFormSubmitted(userId)) return true;
  return repairStuckActivationForm(userId);
}

/** @deprecated Use activationFormSubmitted do AppContext. Mantido só para fallback síncrono. */
export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_DONE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingDoneCache(): void {
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, "true");
  } catch {
    /* ignore */
  }
}

export function clearOnboardingDoneCache(): void {
  try {
    localStorage.removeItem(ONBOARDING_DONE_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated alias */
export const markOnboardingDone = markOnboardingDoneCache;
export const clearOnboardingDone = clearOnboardingDoneCache;
