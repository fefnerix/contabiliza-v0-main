
import { supabase } from "@/integrations/supabase/client";
import { Goal, Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const getGoals = async (): Promise<Goal[]> => {
  try {
    console.log("Iniciando búsqueda de metas...");
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      console.log("Usuario no autenticado");
      return [];
    }

    const userId = authData.user.id;
    console.log("Buscando metas para el usuario autenticado");

    const { data, error } = await supabase
      .from("poupeja_goals")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error al buscar metas:", error);
      throw error;
    }

    console.log("Metas encontradas en la base de datos:", data);

    const goals: Goal[] = [];

    for (const goalData of data) {
      console.log(`Procesando meta ${goalData.id}: ${goalData.name}`);
      console.log(`Valores de la meta en la base de datos: target_amount=${goalData.target_amount}, current_amount=${goalData.current_amount}`);

      // Buscar transacciones relacionadas a la meta
      const { data: transactions } = await supabase
        .from("poupeja_transactions")
        .select("*, category:poupeja_categories(name, color, icon)")
        .eq("goal_id", goalData.id);

      console.log(`Encontradas ${transactions ? transactions.length : 0} transacciones para la meta ${goalData.id}`);

      goals.push({
        id: goalData.id,
        name: goalData.name,
        targetAmount: goalData.target_amount,
        currentAmount: goalData.current_amount,
        startDate: goalData.start_date,
        endDate: goalData.end_date,
        deadline: goalData.deadline,
        color: goalData.color,
        transactions: transactions ? transactions.map((t) => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: t.amount,
          category: t.category ? t.category.name : "Outros",
          categoryColor: t.category ? t.category.color : "#9E9E9E",
          categoryIcon: t.category ? t.category.icon : "grid",
          description: t.description || "",
          date: t.date,
          goalId: t.goal_id
        })) : []
      });
    }

    console.log("Metas procesadas y listas para retorno:", goals);
    return goals;
  } catch (error) {
    console.error("Error al buscar metas:", error);
    return [];
  }
};

export const addGoal = async (goal: Omit<Goal, "id" | "transactions">): Promise<Goal | null> => {
  try {
    console.log("Adding goal:", goal);
    const newId = uuidv4();
    
    // Get the current user
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
        user_id: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error en addGoal:", error);
      throw error;
    }

    console.log("Goal added:", data);

    return {
      id: data.id,
      name: data.name,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      startDate: data.start_date,
      endDate: data.end_date,
      deadline: data.deadline,
      color: data.color,
      transactions: []
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
        color: goal.color
      })
      .eq("id", goal.id)
      .select()
      .single();

    if (error) throw error;

    // Fetch the related transactions
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
      transactions: transactions ? transactions.map((t) => ({
        id: t.id,
        type: t.type as 'income' | 'expense',
        amount: t.amount,
        category: t.category ? t.category.name : "Outros",
        categoryColor: t.category ? t.category.color : "#9E9E9E",
        categoryIcon: t.category ? t.category.icon : "grid",
        description: t.description || "",
        date: t.date,
        goalId: t.goal_id
      })) : []
    };
  } catch (error) {
    console.error("Error actualizando meta:", error);
    return null;
  }
};

export const deleteGoal = async (id: string): Promise<boolean> => {
  try {
    // Actualizar transacciones para remover la referencia a la meta
    await supabase
      .from("poupeja_transactions")
      .update({ goal_id: null })
      .eq("goal_id", id);
    
    const { error } = await supabase
      .from("poupeja_goals")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error eliminando meta:", error);
    return false;
  }
};

// Adicionar esta função ao arquivo goalService.ts
export const recalculateGoalAmounts = async (): Promise<boolean> => {
  try {
    console.log("Recalculando valores de las metas...");
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      console.log("Usuario no autenticado");
      return false;
    }

    const userId = authData.user.id;
    
    // Buscar todas las metas del usuario
    const { data: goals, error: goalsError } = await supabase
      .from("poupeja_goals")
      .select("id, name")
      .eq("user_id", userId);

    if (goalsError) {
      console.error("Error al buscar metas para recálculo:", goalsError);
      return false;
    }

    // Para cada meta, calcular o valor atual com base nas transações
    for (const goal of goals) {
      console.log(`Recalculando valor para meta ${goal.id}: ${goal.name}`);
      
      // Buscar todas las transacciones de ingreso vinculadas a la meta
      const { data: transactions, error: transactionsError } = await supabase
        .from("poupeja_transactions")
        .select("amount")
        .eq("goal_id", goal.id)
        .eq("type", "income");

      if (transactionsError) {
        console.error(`Error al buscar transacciones para meta ${goal.id}:`, transactionsError);
        continue;
      }

      // Calcular el valor total de las transacciones
      const currentAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      console.log(`Valor calculado para meta ${goal.id}: ${currentAmount}`);

      // Actualizar el valor actual de la meta en la base de datos
      const { error: updateError } = await supabase
        .from("poupeja_goals")
        .update({ current_amount: currentAmount })
        .eq("id", goal.id);

      if (updateError) {
        console.error(`Error al actualizar valor de la meta ${goal.id}:`, updateError);
      } else {
        console.log(`Meta ${goal.id} actualizada con éxito!`);
      }
    }

    return true;
  } catch (error) {
    console.error("Error al recalcular valores de las metas:", error);
    return false;
  }
};
