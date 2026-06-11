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

type RpcSubmitResult = {
  success?: boolean;
  submitted_at?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mensagem legível para Error, PostgrestError e objetos com .message */
export function getErrorMessage(err: unknown, fallback = "Error desconocido al guardar"): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

function parseRpcSubmitResult(data: unknown): RpcSubmitResult | null {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as RpcSubmitResult;
    } catch {
      return null;
    }
  }
  if (typeof data === "object") return data as RpcSubmitResult;
  return null;
}

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
  for (let attempt = 0; attempt < 5; attempt++) {
    if (await hasActivationFormSubmitted(userId)) return true;
    await sleep(350 * (attempt + 1));
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

async function saveActivationFormRow(
  userId: string,
  payload: ActivationSubmitPayload,
  submittedAt: string
): Promise<void> {
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
}

async function saveActivationFormSideTables(
  userId: string,
  payload: ActivationSubmitPayload,
  submittedAt: string
): Promise<void> {
  const { error: userError } = await supabase.from("poupeja_users").upsert(
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
  if (userError) console.warn("activation submit: poupeja_users", userError);

  const fp = payload.financial_profile;
  const { error: profileError } = await supabase.from("poupeja_financial_profile").upsert(
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
  if (profileError) console.warn("activation submit: financial_profile", profileError);
}

/** Fallback se RPC ainda não foi aplicada no Supabase remoto. */
async function submitActivationFormLegacy(
  userId: string,
  payload: ActivationSubmitPayload
): Promise<{ submitted_at: string }> {
  const submittedAt = new Date().toISOString();
  await saveActivationFormRow(userId, payload, submittedAt);
  await saveActivationFormSideTables(userId, payload, submittedAt);
  return { submitted_at: submittedAt };
}

async function submitViaRpc(
  payload: ActivationSubmitPayload
): Promise<{ submitted_at: string } | null> {
  const { data, error } = await supabase.rpc("submit_activation_form", {
    p_payload: payload,
  });

  if (error) {
    if (isRpcUnavailable(error)) return null;
    throw error;
  }

  const row = parseRpcSubmitResult(data);
  if (row?.success || row?.submitted_at) {
    return { submitted_at: row.submitted_at ?? new Date().toISOString() };
  }

  throw new Error("La función de guardado no confirmó el éxito");
}

export async function submitActivationFormWithRetry(
  userId: string,
  payload: ActivationSubmitPayload,
  maxAttempts = 3
): Promise<{ submitted_at: string }> {
  let lastMessage = "No se pudo guardar el formulario. Intenta de nuevo.";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let submittedAt: string | null = null;

      const rpcResult = await submitViaRpc(payload);
      if (rpcResult) {
        submittedAt = rpcResult.submitted_at;
      } else {
        const legacy = await submitActivationFormLegacy(userId, payload);
        submittedAt = legacy.submitted_at;
      }

      const verified = await verifyActivationFormSubmitted(userId);
      if (verified) {
        return { submitted_at: submittedAt ?? new Date().toISOString() };
      }

      if (submittedAt) {
        return { submitted_at: submittedAt };
      }

      lastMessage =
        "El formulario no apareció en la base de datos después de guardar. Intenta de nuevo.";
    } catch (err) {
      lastMessage = getErrorMessage(err, lastMessage);
      console.error(`submit activation attempt ${attempt}`, err);
    }
    await sleep(600 * attempt);
  }

  throw new Error(lastMessage);
}
