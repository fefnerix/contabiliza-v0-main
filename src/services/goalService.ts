
import { supabase } from "@/integrations/supabase/client";
import { Goal } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toTransactionAmount } from "@/utils/transactionUtils";

export const getGoals = async (): Promise<Goal[]> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return [];
    }

    const userId = authData.user.id;

    const { data: goalsData, error: goalsError } = await supabase
      .from("poupeja_goals")
      .select("*")
      .eq("user_id", userId);

    if (goalsError) {
      console.error("Error al buscar metas:", goalsError);
      throw goalsError;
    }

    if (!goalsData?.length) {
      return [];
    }

    const goalIds = goalsData.map((g) => g.id);
    const { data: txData, error: txError } = await supabase
      .from("poupeja_transactions")
      .select("*, category:poupeja_categories(name, color, icon)")
      .in("goal_id", goalIds);

    if (txError) {
      console.error("Error al buscar transacciones de metas:", txError);
      throw txError;
    }

    const byGoalId = new Map<string, any[]>();
    for (const row of txData || []) {
      const gid = row.goal_id as string | null;
      if (!gid) continue;
      if (!byGoalId.has(gid)) byGoalId.set(gid, []);
      byGoalId.get(gid)!.push(row);
    }

    return goalsData.map((goalData) => {
      const transactions = byGoalId.get(goalData.id) ?? [];
      return {
        id: goalData.id,
        name: goalData.name,
        targetAmount: goalData.target_amount,
        currentAmount: goalData.current_amount,
        startDate: goalData.start_date,
        endDate: goalData.end_date,
        deadline: goalData.deadline,
        color: goalData.color,
        target_amount: goalData.target_amount,
        current_amount: goalData.current_amount,
        start_date: goalData.start_date,
        end_date: goalData.end_date,
        user_id: goalData.user_id ?? undefined,
        created_at: goalData.created_at ?? undefined,
        updated_at: goalData.updated_at ?? undefined,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type as "income" | "expense",
          amount: toTransactionAmount(t.amount),
          category: t.category ? t.category.name : "Outros",
          categoryColor: t.category ? t.category.color : "#9E9E9E",
          categoryIcon: t.category ? t.category.icon : "grid",
          description: t.description || "",
          date: t.date,
          goalId: t.goal_id,
          category_id: t.category_id,
          goal_id: t.goal_id,
          user_id: t.user_id,
          created_at: t.created_at,
        })),
      };
    });
  } catch (error) {
    console.error("Error al buscar metas:", error);
    return [];
  }
};

export const addGoal = async (goal: Omit<Goal, "id" | "transactions">): Promise<Goal | null> => {
  try {
    const newId = uuidv4();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error("Usuario no autenticado al agregar meta");
      throw new Error("Usuario no autenticado");
    }

    const { data, error } = await supabase
      .from("poupeja_goals")
      .insert({
        id: newId,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
        start_date: goal.startDate,
        end_date: goal.endDate,
        deadline: goal.deadline,
        color: goal.color || "#06465f",
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error en addGoal:", error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      startDate: data.start_date,
      endDate: data.end_date,
      deadline: data.deadline,
      color: data.color,
      transactions: [],
    };
  } catch (error) {
    console.error("Error adding goal:", error);
    return null;
  }
};

export const updateGoal = async (goal: Omit<Goal, "transactions">): Promise<Goal | null> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_goals")
      .update({
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        start_date: goal.startDate,
        end_date: goal.endDate,
        deadline: goal.deadline,
        color: goal.color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id)
      .select()
      .single();

    if (error) {
      console.error("Error en updateGoal:", error);
      throw error;
    }

    const { data: transactions } = await supabase
      .from("poupeja_transactions")
      .select("*, category:poupeja_categories(name, color, icon)")
      .eq("goal_id", goal.id);

    return {
      id: data.id,
      name: data.name,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      startDate: data.start_date,
      endDate: data.end_date,
      deadline: data.deadline,
      color: data.color,
      transactions: transactions
        ? transactions.map((t) => ({
            id: t.id,
            type: t.type as "income" | "expense",
            amount: toTransactionAmount(t.amount),
            category: t.category ? t.category.name : "Outros",
            categoryColor: t.category ? t.category.color : "#9E9E9E",
            categoryIcon: t.category ? t.category.icon : "grid",
            description: t.description || "",
            date: t.date,
            goalId: t.goal_id,
          }))
        : [],
    };
  } catch (error) {
    console.error("Error actualizando meta:", error);
    return null;
  }
};

export const deleteGoal = async (id: string): Promise<boolean> => {
  try {
    await supabase.from("poupeja_transactions").update({ goal_id: null }).eq("goal_id", id);

    const { error } = await supabase.from("poupeja_goals").delete().eq("id", id);

    if (error) {
      console.error("Error eliminando meta:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error eliminando meta:", error);
    return false;
  }
};

export const recalculateGoalAmounts = async (): Promise<boolean> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return false;
    }

    const userId = authData.user.id;

    const { data: goals, error: goalsError } = await supabase
      .from("poupeja_goals")
      .select("id, name, current_amount")
      .eq("user_id", userId);

    if (goalsError) {
      console.error("Error al buscar metas para recálculo:", goalsError);
      return false;
    }

    for (const goal of goals || []) {
      const { data: transactions, error: transactionsError } = await supabase
        .from("poupeja_transactions")
        .select("amount")
        .eq("goal_id", goal.id)
        .eq("type", "income");

      if (transactionsError) {
        console.error(`Error al buscar transacciones para meta ${goal.id}:`, transactionsError);
        continue;
      }

      const newTotal = (transactions || []).reduce(
        (sum, t) => sum + toTransactionAmount(t.amount),
        0
      );

      const stored = toTransactionAmount(goal.current_amount);
      const delta = newTotal - stored;

      if (Math.abs(delta) < 1e-9) continue;

      const { error: rpcError } = await supabase.rpc("update_goal_amount", {
        p_goal_id: goal.id,
        p_amount_change: delta,
      });

      if (rpcError) {
        console.error(`Error RPC update_goal_amount meta ${goal.id}:`, rpcError);
      }
    }

    return true;
  } catch (error) {
    console.error("Error al recalcular valores de las metas:", error);
    return false;
  }
};
