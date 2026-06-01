
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface UpdateTransactionData {
  type?: "income" | "expense";
  amount?: number;
  category_id?: string | null;
  description?: string | null;
  date?: string;
  goal_id?: string | null;
}

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_transactions")
      .select(`
        *,
        category:poupeja_categories(id, name, icon, color, type)
      `)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      type: item.type as 'income' | 'expense',
      amount: item.amount,
      category: item.category?.name || "Otros",
      categoryIcon: item.category?.icon || "circle",
      categoryColor: item.category?.color || "#607D8B",
      description: item.description || "",
      date: item.date,
      goalId: item.goal_id || undefined,
      created_at: item.created_at || undefined,
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const addTransaction = async (transaction: Omit<Transaction, "id">): Promise<Transaction | null> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      throw new Error("You must be logged in to add a transaction");
    }

    const userId = authData.user.id;
    const newId = uuidv4();

    // Get category ID - if it's already an ID, use it directly, otherwise find by name
    let categoryId = transaction.category;
    
    // Check if the category is actually a category ID by trying to find it
    const { data: categoryCheck } = await supabase
      .from("poupeja_categories")
      .select("id")
      .eq("id", transaction.category)
      .single();
    
    if (!categoryCheck) {
      // If not found by ID, try to find by name
      const { data: categoryByName } = await supabase
        .from("poupeja_categories")
        .select("id")
        .eq("name", transaction.category)
        .eq("type", transaction.type)
        .single();
      
      if (categoryByName) {
        categoryId = categoryByName.id;
      } else {
        // Fallback to default "Outros" category
        const defaultCategoryId = transaction.type === 'income' ? 'other-income' : 'other-expense';
        categoryId = defaultCategoryId;
      }
    }

    const { data, error } = await supabase
      .from("poupeja_transactions")
      .insert({
        id: newId,
        type: transaction.type,
        amount: transaction.amount,
        category_id: categoryId,
        description: transaction.description,
        date: transaction.date,
        goal_id: transaction.goalId,
        user_id: userId
      })
      .select(`
        *,
        category:poupeja_categories(id, name, icon, color, type)
      `)
      .single();

    if (error) throw error;

    // If this is an income transaction linked to a goal, update the goal's current amount
    if (transaction.type === 'income' && transaction.goalId) {
      console.log("Updating goal current amount for income transaction");
      const { error: goalError } = await supabase.rpc('update_goal_amount', {
        p_goal_id: transaction.goalId,
        p_amount_change: transaction.amount
      });
      
      if (goalError) {
        console.error("Error updating goal amount:", goalError);
      } else {
        console.log("Goal amount updated successfully");
      }
    }

    return {
      id: data.id,
      type: data.type as 'income' | 'expense',
      amount: data.amount,
      category: data.category?.name || "Outros",
      categoryIcon: data.category?.icon || "circle",
      categoryColor: data.category?.color || "#607D8B",
      description: data.description || "",
      date: data.date,
      goalId: data.goal_id || undefined
    };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return null;
  }
};

export const updateTransaction = async (
  id: string,
  data: UpdateTransactionData
): Promise<Transaction> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      throw new Error("You must be logged in to update a transaction");
    }

    const { data: updated, error } = await supabase
      .from("poupeja_transactions")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", authData.user.id)
      .select(`
        *,
        category:poupeja_categories(id, name, icon, color, type)
      `)
      .single();

    if (error) throw error;
    if (!updated) throw new Error("Transaction not found");

    return {
      id: updated.id,
      type: updated.type as "income" | "expense",
      amount: updated.amount,
      category: updated.category?.name || "Outros",
      categoryIcon: updated.category?.icon || "circle",
      categoryColor: updated.category?.color || "#607D8B",
      description: updated.description || "",
      date: updated.date,
      goalId: updated.goal_id || undefined,
      category_id: updated.category_id || undefined,
      goal_id: updated.goal_id || undefined,
      user_id: updated.user_id || undefined,
      created_at: updated.created_at || undefined,
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    // First, get the transaction to check if it's linked to a goal
    const { data: transactionToDelete } = await supabase
      .from("poupeja_transactions")
      .select("goal_id, amount, type")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("poupeja_transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // If this was an income transaction linked to a goal, subtract the amount from the goal
    if (transactionToDelete && transactionToDelete.type === 'income' && transactionToDelete.goal_id) {
      await supabase.rpc('update_goal_amount', {
        p_goal_id: transactionToDelete.goal_id,
        p_amount_change: -transactionToDelete.amount
      });
    }

    return true;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return false;
  }
};
