import { supabase } from "@/integrations/supabase/client";

export type ActivationSubmitPayload = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  country_code: string | null;
  currency: string;
  currency_code: string;
  monthly_income: number | null;
  goal_amount: number | null;
  total_debt: number;
  form_data: Record<string, unknown>;
  financial_profile: {
    monthly_income: number | null;
    fixed_expenses: number | null;
    variable_expenses: number | null;
    total_debt: number;
    monthly_savings: number | null;
    goal_12m: string | null;
    goal_amount: number | null;
    biggest_challenge: string | null;
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function hasActivationFormSubmitted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("poupeja_activation_forms")
    .select("submitted_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.submitted_at);
}

/** Confirma no banco que submitted_at foi gravado (evita falso positivo). */
export async function verifyActivationFormSubmitted(userId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await hasActivationFormSubmitted(userId)) return true;
    await sleep(400 * (attempt + 1));
  }
  return false;
}

export async function saveActivationFormDraft(payload: ActivationSubmitPayload): Promise<void> {
  const { error } = await supabase.rpc("save_activation_form_draft", {
    p_payload: payload,
  });
  if (error) throw error;
}

const isRpcUnavailable = (error: { message?: string; code?: string }) =>
  error.code === "PGRST202" ||
  error.code === "42883" ||
  (error.message ?? "").toLowerCase().includes("submit_activation_form");

/** Fallback se RPC ainda não foi aplicada no Supabase remoto. */
async function submitActivationFormLegacy(
  userId: string,
  payload: ActivationSubmitPayload
): Promise<{ submitted_at: string }> {
  const submittedAt = new Date().toISOString();
  const { error: formError } = await supabase.from("poupeja_activation_forms").upsert(
    {
      user_id: userId,
      full_name: payload.full_name || null,
      email: payload.email || null,
      phone: payload.phone || null,
      country: payload.country || null,
      currency: payload.currency || null,
      monthly_income: payload.monthly_income,
      goal_amount: payload.goal_amount,
      total_debt: payload.total_debt,
      form_data: { ...payload.form_data, submittedAt },
      submitted_at: submittedAt,
      updated_at: submittedAt,
    },
    { onConflict: "user_id" }
  );
  if (formError) throw formError;

  await supabase.from("poupeja_users").upsert(
    {
      id: userId,
      email: payload.email,
      name: payload.full_name || null,
      phone: payload.phone || null,
      country: payload.country_code,
      currency: payload.currency_code,
    },
    { onConflict: "id" }
  );

  const fp = payload.financial_profile;
  await supabase.from("poupeja_financial_profile").upsert(
    {
      user_id: userId,
      monthly_income: fp.monthly_income,
      fixed_expenses: fp.fixed_expenses,
      variable_expenses: fp.variable_expenses,
      total_debt: fp.total_debt,
      monthly_savings: fp.monthly_savings,
      goal_12m: fp.goal_12m,
      goal_amount: fp.goal_amount,
      biggest_challenge: fp.biggest_challenge,
      completed_at: submittedAt,
      updated_at: submittedAt,
    },
    { onConflict: "user_id" }
  );

  return { submitted_at: submittedAt };
}

export async function submitActivationFormWithRetry(
  userId: string,
  payload: ActivationSubmitPayload,
  maxAttempts = 3
): Promise<{ submitted_at: string }> {
  let lastMessage = "Error desconocido al guardar";
  let useLegacy = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (useLegacy) {
        await submitActivationFormLegacy(userId, payload);
      } else {
        const { data, error } = await supabase.rpc("submit_activation_form", {
          p_payload: payload,
        });

        if (error) {
          if (isRpcUnavailable(error)) {
            useLegacy = true;
            await submitActivationFormLegacy(userId, payload);
          } else {
            throw error;
          }
        } else {
          const row = data as { success?: boolean; submitted_at?: string } | null;
          if (!row?.success) {
            throw new Error("La función de guardado no confirmó el éxito");
          }
        }
      }

      const verified = await verifyActivationFormSubmitted(userId);
      if (verified) {
        return { submitted_at: new Date().toISOString() };
      }
      lastMessage = "El formulario no apareció en la base de datos después de guardar";
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : lastMessage;
      console.error(`submit activation attempt ${attempt}`, err);
    }
    await sleep(600 * attempt);
  }

  throw new Error(lastMessage);
}
