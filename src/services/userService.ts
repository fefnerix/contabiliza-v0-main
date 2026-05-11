
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("poupeja_users")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (error) {
      console.error("Error obteniendo perfil del usuario:", error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name || user.email?.split('@')[0] || "Usuario",
      email: data.email || user.email || "",
      profileImage: data.profile_image,
      phone: data.phone || "",
      achievements: [] // Return empty array since achievements tables don't exist yet
    };
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    return null;
  }
};

export const updateUserProfile = async (
  userData: Partial<{ name: string; profileImage: string; phone: string; }>
): Promise<User | null> => {
  try {
    console.log('userService: Updating user profile with data:', userData);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('userService: No se encontró usuario autenticado');
      return null;
    }
    
    // Map camelCase to snake_case for database
    const updateData: any = {};
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.profileImage !== undefined) updateData.profile_image = userData.profileImage;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    
    console.log('userService: Updating database with mapped data:', updateData);
    
    const { data, error } = await supabase
      .from("poupeja_users")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();
    
    if (error) {
      console.error('userService: Error de actualización de base de datos:', error);
      throw error;
    }
    
    console.log('userService: Perfil actualizado con éxito:', data);
    
    // Map snake_case back to camelCase for return
    return {
      id: data.id,
      name: data.name || user.email?.split('@')[0] || "Usuario",
      email: data.email || user.email || "",
      profileImage: data.profile_image,
      phone: data.phone || "",
      achievements: [] // Return empty array since achievements tables don't exist yet
    };
  } catch (error) {
    console.error("userService: Error actualizando perfil del usuario:", error);
    return null;
  }
};

export const getUserAchievements = async (): Promise<any[]> => {
  try {
    // Since achievements tables don't exist yet, return empty array
    // This can be implemented later when the achievements feature is fully developed
    return [];
  } catch (error) {
    console.error("Error obteniendo logros del usuario:", error);
    return [];
  }
};

export const updateUserPreferences = async (
  preferences: Partial<{
    language: string;
    currency: string;
    country: string;
    timezone: string;
  }>
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, string> = {};
    if (preferences.language) updateData.language = preferences.language;
    if (preferences.currency) updateData.currency = preferences.currency;
    if (preferences.country) updateData.country = preferences.country;
    if (preferences.timezone) updateData.timezone = preferences.timezone;

    if (Object.keys(updateData).length === 0) return true;

    const { error } = await supabase
      .from("poupeja_users")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      console.error('Error saving preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return false;
  }
};
