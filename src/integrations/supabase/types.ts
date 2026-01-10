export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bog_tier_config: {
        Row: {
          car_requirement: number | null
          liquidity_requirement: number | null
          max_loan_per_borrower_ghs: number | null
          min_capital_ghs: number
          prudential_frequency: string | null
          requires_bog_license: boolean | null
          single_obligor_limit_percent: number | null
          tier: Database["public"]["Enums"]["bog_mfi_tier"]
          tier_description: string | null
          tier_name: string
        }
        Insert: {
          car_requirement?: number | null
          liquidity_requirement?: number | null
          max_loan_per_borrower_ghs?: number | null
          min_capital_ghs: number
          prudential_frequency?: string | null
          requires_bog_license?: boolean | null
          single_obligor_limit_percent?: number | null
          tier: Database["public"]["Enums"]["bog_mfi_tier"]
          tier_description?: string | null
          tier_name: string
        }
        Update: {
          car_requirement?: number | null
          liquidity_requirement?: number | null
          max_loan_per_borrower_ghs?: number | null
          min_capital_ghs?: number
          prudential_frequency?: string | null
          requires_bog_license?: boolean | null
          single_obligor_limit_percent?: number | null
          tier?: Database["public"]["Enums"]["bog_mfi_tier"]
          tier_description?: string | null
          tier_name?: string
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          client_id: string
          description: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          org_id: string
          tags: string[] | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          description?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          org_id: string
          tags?: string[] | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          description?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          org_id?: string
          tags?: string[] | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_id: string
          client_type: Database["public"]["Enums"]["client_type"]
          created_at: string
          date_of_birth: string
          email: string | null
          first_name: string
          gender: string
          ghana_card_expiry: string
          ghana_card_number: string
          group_name: string | null
          last_name: string
          monthly_expenses: number | null
          monthly_income: number | null
          nationality: string
          occupation: string
          org_id: string
          phone: string | null
          proof_of_residence_type: string | null
          registration_date: string | null
          registration_number: string | null
          risk_category: string
          source_of_funds: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_id?: string
          client_type?: Database["public"]["Enums"]["client_type"]
          created_at?: string
          date_of_birth: string
          email?: string | null
          first_name: string
          gender: string
          ghana_card_expiry: string
          ghana_card_number: string
          group_name?: string | null
          last_name: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          nationality?: string
          occupation: string
          org_id: string
          phone?: string | null
          proof_of_residence_type?: string | null
          registration_date?: string | null
          registration_number?: string | null
          risk_category: string
          source_of_funds: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_id?: string
          client_type?: Database["public"]["Enums"]["client_type"]
          created_at?: string
          date_of_birth?: string
          email?: string | null
          first_name?: string
          gender?: string
          ghana_card_expiry?: string
          ghana_card_number?: string
          group_name?: string | null
          last_name?: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          nationality?: string
          occupation?: string
          org_id?: string
          phone?: string | null
          proof_of_residence_type?: string | null
          registration_date?: string | null
          registration_number?: string | null
          risk_category?: string
          source_of_funds?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          address: string | null
          client_id: string
          created_at: string
          date_of_birth: string
          email: string | null
          first_name: string
          gender: string
          ghana_card_expiry: string
          ghana_card_number: string
          is_active: boolean
          last_name: string
          member_id: string
          monthly_expenses: number | null
          monthly_income: number | null
          nationality: string
          occupation: string
          org_id: string
          phone: string | null
          proof_of_residence_type: string | null
          risk_category: string
          role: Database["public"]["Enums"]["group_member_role"]
          source_of_funds: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_id: string
          created_at?: string
          date_of_birth: string
          email?: string | null
          first_name: string
          gender: string
          ghana_card_expiry: string
          ghana_card_number: string
          is_active?: boolean
          last_name: string
          member_id?: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          nationality?: string
          occupation: string
          org_id: string
          phone?: string | null
          proof_of_residence_type?: string | null
          risk_category: string
          role?: Database["public"]["Enums"]["group_member_role"]
          source_of_funds: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_id?: string
          created_at?: string
          date_of_birth?: string
          email?: string | null
          first_name?: string
          gender?: string
          ghana_card_expiry?: string
          ghana_card_number?: string
          is_active?: boolean
          last_name?: string
          member_id?: string
          monthly_expenses?: number | null
          monthly_income?: number | null
          nationality?: string
          occupation?: string
          org_id?: string
          phone?: string | null
          proof_of_residence_type?: string | null
          risk_category?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          source_of_funds?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      organisation_settings: {
        Row: {
          bog_tier: Database["public"]["Enums"]["bog_mfi_tier"]
          car_threshold: number | null
          created_at: string
          id: string
          license_expiry: string | null
          license_number: string | null
          liquidity_threshold: number | null
          max_loan_amount: number | null
          max_single_obligor_limit: number | null
          min_capital_requirement: number | null
          net_worth: number | null
          org_id: string
          prudential_return_frequency: string | null
          updated_at: string
        }
        Insert: {
          bog_tier?: Database["public"]["Enums"]["bog_mfi_tier"]
          car_threshold?: number | null
          created_at?: string
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          liquidity_threshold?: number | null
          max_loan_amount?: number | null
          max_single_obligor_limit?: number | null
          min_capital_requirement?: number | null
          net_worth?: number | null
          org_id: string
          prudential_return_frequency?: string | null
          updated_at?: string
        }
        Update: {
          bog_tier?: Database["public"]["Enums"]["bog_mfi_tier"]
          car_threshold?: number | null
          created_at?: string
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          liquidity_threshold?: number | null
          max_loan_amount?: number | null
          max_single_obligor_limit?: number | null
          min_capital_requirement?: number | null
          net_worth?: number | null
          org_id?: string
          prudential_return_frequency?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bog_mfi_tier: "TIER_1_RCB" | "TIER_2_SL" | "TIER_3_FH" | "TIER_4_MFC"
      client_type: "INDIVIDUAL" | "GROUP" | "COOPERATIVE" | "SME"
      group_member_role: "LEADER" | "SECRETARY" | "MEMBER"
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
      bog_mfi_tier: ["TIER_1_RCB", "TIER_2_SL", "TIER_3_FH", "TIER_4_MFC"],
      client_type: ["INDIVIDUAL", "GROUP", "COOPERATIVE", "SME"],
      group_member_role: ["LEADER", "SECRETARY", "MEMBER"],
    },
  },
} as const
