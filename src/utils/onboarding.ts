import { supabase } from "@/integrations/supabase/client";
import { hasActivationFormSubmitted } from "@/services/activationFormService";

/** Cache opcional — NUNCA é fonte de verdade sozinho. */
export const ONBOARDING_DONE_KEY = "contabiliza_onboarding_done";

/** Fonte de verdade: submitted_at em poupeja_activation_forms. */
export async function syncOnboardingStatusFromDb(userId: string): Promise<boolean> {
  try {
    const submitted = await hasActivationFormSubmitted(userId);
    if (submitted) {
      markOnboardingDoneCache();
      return true;
    }
    clearOnboardingDoneCache();
    return false;
  } catch (e) {
    console.error("syncOnboardingStatusFromDb", e);
    return false;
  }
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
