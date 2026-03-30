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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          collateral_sale_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          collateral_sale_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          collateral_sale_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_collateral_sale_id_fkey"
            columns: ["collateral_sale_id"]
            isOneToOne: false
            referencedRelation: "collateral_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collateral: {
        Row: {
          agent_verified_value: number | null
          brand_model: string
          collateral_code: string | null
          created_at: string | null
          id: string
          item_type: string
          market_value: number
          status: string | null
          updated_at: string | null
          user_id: string
          verification_date: string | null
          verified_by: string | null
        }
        Insert: {
          agent_verified_value?: number | null
          brand_model: string
          collateral_code?: string | null
          created_at?: string | null
          id?: string
          item_type: string
          market_value: number
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
          verified_by?: string | null
        }
        Update: {
          agent_verified_value?: number | null
          brand_model?: string
          collateral_code?: string | null
          created_at?: string | null
          id?: string
          item_type?: string
          market_value?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collateral_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collateral_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collateral_sales: {
        Row: {
          borrower_id: string
          buyer_id: string | null
          collateral_id: string
          created_at: string | null
          id: string
          loan_id: string
          purchased_at: string | null
          sale_price: number
          status: string
          updated_at: string | null
        }
        Insert: {
          borrower_id: string
          buyer_id?: string | null
          collateral_id: string
          created_at?: string | null
          id?: string
          loan_id: string
          purchased_at?: string | null
          sale_price: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          borrower_id?: string
          buyer_id?: string | null
          collateral_id?: string
          created_at?: string | null
          id?: string
          loan_id?: string
          purchased_at?: string | null
          sale_price?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collateral_sales_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collateral_sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collateral_sales_collateral_id_fkey"
            columns: ["collateral_id"]
            isOneToOne: false
            referencedRelation: "collateral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collateral_sales_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agent_id: string
          amount: number
          created_at: string | null
          id: string
          loan_id: string
          paid_at: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string | null
          id?: string
          loan_id: string
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          loan_id?: string
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_verifications: {
        Row: {
          contract_id: string
          id: string
          user_agent: string | null
          verification_method: string | null
          verified_at: string | null
          verified_by_ip: string | null
        }
        Insert: {
          contract_id: string
          id?: string
          user_agent?: string | null
          verification_method?: string | null
          verified_at?: string | null
          verified_by_ip?: string | null
        }
        Update: {
          contract_id?: string
          id?: string
          user_agent?: string | null
          verification_method?: string | null
          verified_at?: string | null
          verified_by_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_verifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "loan_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount_invested: number
          created_at: string | null
          date: string | null
          id: string
          lender_id: string
          loan_id: string
        }
        Insert: {
          amount_invested: number
          created_at?: string | null
          date?: string | null
          id?: string
          lender_id: string
          loan_id: string
        }
        Update: {
          amount_invested?: number
          created_at?: string | null
          date?: string | null
          id?: string
          lender_id?: string
          loan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          created_at: string | null
          date_of_birth: string
          full_name: string
          has_id_back_image: boolean | null
          has_id_front_image: boolean | null
          has_selfie_image: boolean | null
          has_signature_image: boolean | null
          id: string
          id_back_image_url: string | null
          id_front_image_url: string | null
          id_number: string
          selfie_image_url: string | null
          signature_image_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_score: number | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          full_name: string
          has_id_back_image?: boolean | null
          has_id_front_image?: boolean | null
          has_selfie_image?: boolean | null
          has_signature_image?: boolean | null
          id?: string
          id_back_image_url?: string | null
          id_front_image_url?: string | null
          id_number: string
          selfie_image_url?: string | null
          signature_image_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_score?: number | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          full_name?: string
          has_id_back_image?: boolean | null
          has_id_front_image?: boolean | null
          has_selfie_image?: boolean | null
          has_signature_image?: boolean | null
          id?: string
          id_back_image_url?: string | null
          id_front_image_url?: string | null
          id_number?: string
          selfie_image_url?: string | null
          signature_image_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_score?: number | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_contracts: {
        Row: {
          borrower_id: string
          created_at: string | null
          due_date: string
          id: string
          lender_ids: Json
          loan_id: string
          pdf_url: string
          principal_amount: number
          status: string | null
          total_repayment: number
          updated_at: string | null
        }
        Insert: {
          borrower_id: string
          created_at?: string | null
          due_date: string
          id?: string
          lender_ids?: Json
          loan_id: string
          pdf_url: string
          principal_amount: number
          status?: string | null
          total_repayment: number
          updated_at?: string | null
        }
        Update: {
          borrower_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          lender_ids?: Json
          loan_id?: string
          pdf_url?: string
          principal_amount?: number
          status?: string | null
          total_repayment?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_contracts_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_contracts_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: true
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          borrower_id: string
          collateral_id: string
          contract_pdf: string | null
          created_at: string | null
          duration_months: number
          funded_amount: number | null
          id: string
          interest_rate: number | null
          principal_amount: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          borrower_id: string
          collateral_id: string
          contract_pdf?: string | null
          created_at?: string | null
          duration_months: number
          funded_amount?: number | null
          id?: string
          interest_rate?: number | null
          principal_amount: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          borrower_id?: string
          collateral_id?: string
          contract_pdf?: string | null
          created_at?: string | null
          duration_months?: number
          funded_amount?: number | null
          id?: string
          interest_rate?: number | null
          principal_amount?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_collateral_id_fkey"
            columns: ["collateral_id"]
            isOneToOne: true
            referencedRelation: "collateral"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          borrower_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          loan_id: string
          mpesa_transaction_id: string | null
          payment_type: string
          status: string | null
        }
        Insert: {
          amount: number
          borrower_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          loan_id: string
          mpesa_transaction_id?: string | null
          payment_type: string
          status?: string | null
        }
        Update: {
          amount?: number
          borrower_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          loan_id?: string
          mpesa_transaction_id?: string | null
          payment_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          commission_rate: number | null
          created_at: string | null
          date_joined: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          is_promoted_admin: boolean | null
          is_staff: boolean | null
          is_superuser: boolean | null
          last_login: string | null
          last_name: string | null
          national_id: string
          phone_number: string
          role: string
          total_earnings: number | null
          updated_at: string | null
          username: string
          wallet_balance: number | null
        }
        Insert: {
          auth_user_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          date_joined?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_promoted_admin?: boolean | null
          is_staff?: boolean | null
          is_superuser?: boolean | null
          last_login?: string | null
          last_name?: string | null
          national_id: string
          phone_number: string
          role: string
          total_earnings?: number | null
          updated_at?: string | null
          username: string
          wallet_balance?: number | null
        }
        Update: {
          auth_user_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          date_joined?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_promoted_admin?: boolean | null
          is_staff?: boolean | null
          is_superuser?: boolean | null
          last_login?: string | null
          last_name?: string | null
          national_id?: string
          phone_number?: string
          role?: string
          total_earnings?: number | null
          updated_at?: string | null
          username?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_insurance_fee: { Args: { principal: number }; Returns: number }
      calculate_max_loan_amount: {
        Args: { market_val: number }
        Returns: number
      }
      calculate_monthly_interest: {
        Args: { principal: number; rate?: number }
        Returns: number
      }
      calculate_platform_fee: { Args: { principal: number }; Returns: number }
      calculate_total_repayment: {
        Args: { duration: number; principal: number; rate?: number }
        Returns: number
      }
      check_overdue_contracts: {
        Args: never
        Returns: {
          borrower_id: string
          contract_id: string
          days_overdue: number
          loan_id: string
          principal_amount: number
        }[]
      }
      get_contract_summary: {
        Args: never
        Returns: {
          active_contracts: number
          overdue_contracts: number
          total_contracts: number
          total_value: number
        }[]
      }
      is_admin: { Args: { auth_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
