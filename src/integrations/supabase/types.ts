export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      poupeja_categories: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      poupeja_customers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          stripe_customer_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          stripe_customer_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          stripe_customer_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      poupeja_financial_profile: {
        Row: {
          biggest_challenge: string | null
          completed_at: string | null
          created_at: string | null
          fixed_expenses: number | null
          goal_12m: string | null
          goal_amount: number | null
          monthly_income: number | null
          monthly_savings: number | null
          total_debt: number | null
          updated_at: string | null
          user_id: string
          variable_expenses: number | null
        }
        Insert: {
          biggest_challenge?: string | null
          completed_at?: string | null
          created_at?: string | null
          fixed_expenses?: number | null
          goal_12m?: string | null
          goal_amount?: number | null
          monthly_income?: number | null
          monthly_savings?: number | null
          total_debt?: number | null
          updated_at?: string | null
          user_id: string
          variable_expenses?: number | null
        }
        Update: {
          biggest_challenge?: string | null
          completed_at?: string | null
          created_at?: string | null
          fixed_expenses?: number | null
          goal_12m?: string | null
          goal_amount?: number | null
          monthly_income?: number | null
          monthly_savings?: number | null
          total_debt?: number | null
          updated_at?: string | null
          user_id?: string
          variable_expenses?: number | null
        }
        Relationships: []
      }
      poupeja_activation_forms: {
        Row: {
          country: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          form_data: Json
          full_name: string | null
          goal_amount: number | null
          monthly_income: number | null
          phone: string | null
          submitted_at: string | null
          total_debt: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          form_data?: Json
          full_name?: string | null
          goal_amount?: number | null
          monthly_income?: number | null
          phone?: string | null
          submitted_at?: string | null
          total_debt?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          form_data?: Json
          full_name?: string | null
          goal_amount?: number | null
          monthly_income?: number | null
          phone?: string | null
          submitted_at?: string | null
          total_debt?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poupeja_goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          target_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          target_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          target_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      poupeja_scheduled_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          goal_id: string | null
          id: string
          last_execution_date: string | null
          next_execution_date: string | null
          paid_amount: number | null
          paid_date: string | null
          recurrence: string | null
          scheduled_date: string
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          goal_id?: string | null
          id?: string
          last_execution_date?: string | null
          next_execution_date?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          recurrence?: string | null
          scheduled_date: string
          status?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          goal_id?: string | null
          id?: string
          last_execution_date?: string | null
          next_execution_date?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          recurrence?: string | null
          scheduled_date?: string
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poupeja_scheduled_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "poupeja_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poupeja_scheduled_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "poupeja_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      poupeja_settings: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          encrypted: boolean | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypted?: boolean | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          encrypted?: boolean | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: []
      }
      poupeja_settings_history: {
        Row: {
          action: string
          category: string
          changed_at: string | null
          changed_by: string | null
          id: string
          key: string
          new_value: string | null
          old_value: string | null
          setting_id: string | null
        }
        Insert: {
          action: string
          category: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          key: string
          new_value?: string | null
          old_value?: string | null
          setting_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          key?: string
          new_value?: string | null
          old_value?: string | null
          setting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poupeja_settings_history_setting_id_fkey"
            columns: ["setting_id"]
            isOneToOne: false
            referencedRelation: "poupeja_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      poupeja_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      poupeja_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          goal_id: string | null
          id: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          goal_id?: string | null
          id?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poupeja_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "poupeja_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poupeja_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "poupeja_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      poupeja_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          purpose: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          purpose?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          purpose?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poupeja_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "poupeja_users"
            referencedColumns: ["id"]
          },
        ]
      }
      poupeja_users: {
        Row: {
          country: string | null
          created_at: string | null
          currency: string | null
          currency_symbol: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
          profile_image: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          email: string
          id: string
          name?: string | null
          phone?: string | null
          profile_image?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          profile_image?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_cadastro_por_email: {
        Args: { p_email: string }
        Returns: {
          user_id: string
          email: string
          subscription_status: string
          plan_type: string
          current_period_end: string
        }[]
      }
      check_user_role: {
        Args: {
          user_id: string
          target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      confirm_user_email: {
        Args: { user_email: string }
        Returns: boolean
      }
      create_default_categories_for_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      create_initial_admin_user: {
        Args: { admin_email?: string }
        Returns: undefined
      }
      create_update_goal_amount_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_setting_value: {
        Args: { p_encrypted_value: string }
        Returns: string
      }
      encrypt_setting_value: {
        Args: { p_value: string }
        Returns: string
      }
      generate_upload_path: {
        Args: { user_id: string; file_extension: string }
        Returns: string
      }
      get_file_public_url: {
        Args: { file_path: string }
        Returns: string
      }
      get_spending_by_category: {
        Args: {
          p_user_id: string
          p_category_name?: string | null
          p_date_from: string
          p_date_to: string
          p_type?: string | null
        }
        Returns: {
          category_name: string
          total_amount: number
          transaction_count: number
          avg_amount: number
        }[]
      }
      get_spending_summary: {
        Args: {
          p_user_id: string
          p_date_from: string
          p_date_to: string
        }
        Returns: {
          category_name: string
          type: string
          total_amount: number
          percentage: number
          transaction_count: number
        }[]
      }
      get_setting: {
        Args: { p_category: string; p_key: string }
        Returns: string
      }
      get_settings_by_category: {
        Args: { p_category: string }
        Returns: {
          key: string
          value: string
          value_type: string
          encrypted: boolean
          description: string
        }[]
      }
      get_user_subscription_status: {
        Args: { p_user_id?: string }
        Returns: {
          subscription_id: string
          status: string
          plan_type: string
          current_period_end: string
          is_active: boolean
        }[]
      }
      grant_admin_access_to_user: {
        Args: { target_email: string }
        Returns: boolean
      }
      grant_admin_role: {
        Args: { target_email: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      migrate_existing_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recover_missing_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          recovered_count: number
        }[]
      }
      register_upload: {
        Args: {
          p_file_name: string
          p_file_path: string
          p_file_size?: number
          p_mime_type?: string
          p_purpose?: string
        }
        Returns: string
      }
      test_trigger_system: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          status: string
          details: string
        }[]
      }
      test_user_creation_system: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_goal_amount: {
        Args: { p_goal_id: string; p_amount_change: number }
        Returns: number
      }
      update_subscription_status: {
        Args: {
          p_stripe_subscription_id: string
          p_status: string
          p_current_period_start?: string
          p_current_period_end?: string
          p_cancel_at_period_end?: boolean
        }
        Returns: string
      }
      upsert_setting: {
        Args: {
          p_category: string
          p_key: string
          p_value: string
          p_value_type?: string
          p_encrypted?: boolean
          p_description?: string
        }
        Returns: string
      }
      validate_file_type: {
        Args: { file_name: string; allowed_extensions?: string[] }
        Returns: boolean
      }
      verify_installation: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          status: string
          details: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
