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
      accounts: {
        Row: {
          created_at: string
          current_balance: number
          description: string | null
          id: string
          initial_balance: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          description?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          description?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_instructions: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          created_at: string
          hex_code: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hex_code?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hex_code?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          birthdate: string | null
          created_at: string
          customer_type_id: string | null
          division_id: string | null
          email: string | null
          gender: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string
          thana_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birthdate?: string | null
          created_at?: string
          customer_type_id?: string | null
          division_id?: string | null
          email?: string | null
          gender: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone: string
          thana_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birthdate?: string | null
          created_at?: string
          customer_type_id?: string | null
          division_id?: string | null
          email?: string | null
          gender?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string
          thana_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_customer_type_id_fkey"
            columns: ["customer_type_id"]
            isOneToOne: false
            referencedRelation: "customer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_thana_id_fkey"
            columns: ["thana_id"]
            isOneToOne: false
            referencedRelation: "thanas"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          gsm: string | null
          id: string
          name: string
          season: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gsm?: string | null
          id?: string
          name: string
          season?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gsm?: string | null
          id?: string
          name?: string
          season?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          color_id: string | null
          created_at: string
          id: string
          image_url: string
          is_main: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_main?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_main?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_id: string | null
          created_at: string
          id: string
          is_active: boolean
          material_id: string | null
          product_id: string
          purchase_price: number
          selling_price: number
          size_id: string | null
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          material_id?: string | null
          product_id: string
          purchase_price?: number
          selling_price?: number
          size_id?: string | null
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          color_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          material_id?: string | null
          product_id?: string
          purchase_price?: number
          selling_price?: number
          size_id?: string | null
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand_id: string | null
          care_instruction_id: string | null
          category_id: string | null
          created_at: string
          full_description: string | null
          id: string
          is_active: boolean
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          short_description: string | null
          size_guide_id: string | null
          sku: string
          updated_at: string
          youtube_autoplay: boolean
          youtube_mute: boolean
          youtube_url: string | null
        }
        Insert: {
          base_price?: number
          brand_id?: string | null
          care_instruction_id?: string | null
          category_id?: string | null
          created_at?: string
          full_description?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          short_description?: string | null
          size_guide_id?: string | null
          sku: string
          updated_at?: string
          youtube_autoplay?: boolean
          youtube_mute?: boolean
          youtube_url?: string | null
        }
        Update: {
          base_price?: number
          brand_id?: string | null
          care_instruction_id?: string | null
          category_id?: string | null
          created_at?: string
          full_description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          short_description?: string | null
          size_guide_id?: string | null
          sku?: string
          updated_at?: string
          youtube_autoplay?: boolean
          youtube_mute?: boolean
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_care_instruction_id_fkey"
            columns: ["care_instruction_id"]
            isOneToOne: false
            referencedRelation: "care_instructions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_usages: {
        Row: {
          benefit_amount: number | null
          benefit_type: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          promo_code: string
          used_at: string
        }
        Insert: {
          benefit_amount?: number | null
          benefit_type?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          promo_code: string
          used_at?: string
        }
        Update: {
          benefit_amount?: number | null
          benefit_type?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          promo_code?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_usages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      size_guides: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sizes: {
        Row: {
          created_at: string
          fit_type: string | null
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fit_type?: string | null
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fit_type?: string | null
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sms_apis: {
        Row: {
          api_base_url: string
          api_key: string
          content_type: string
          created_at: string
          header_params: Json | null
          http_method: string
          id: string
          is_active: boolean
          message_param_name: string
          phone_param_name: string
          provider_name: string
          sender_id: string | null
          updated_at: string
        }
        Insert: {
          api_base_url: string
          api_key: string
          content_type?: string
          created_at?: string
          header_params?: Json | null
          http_method?: string
          id?: string
          is_active?: boolean
          message_param_name?: string
          phone_param_name?: string
          provider_name: string
          sender_id?: string | null
          updated_at?: string
        }
        Update: {
          api_base_url?: string
          api_key?: string
          content_type?: string
          created_at?: string
          header_params?: Json | null
          http_method?: string
          id?: string
          is_active?: boolean
          message_param_name?: string
          phone_param_name?: string
          provider_name?: string
          sender_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_birthday_logs: {
        Row: {
          campaign_id: string | null
          customer_id: string
          id: string
          sent_at: string
          year: number
        }
        Insert: {
          campaign_id?: string | null
          customer_id: string
          id?: string
          sent_at?: string
          year: number
        }
        Update: {
          campaign_id?: string | null
          customer_id?: string
          id?: string
          sent_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sms_birthday_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_birthday_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_campaign_logs: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          message: string
          phone: string
          response: Json | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          message: string
          phone: string
          response?: Json | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string
          phone?: string
          response?: Json | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaign_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaign_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_campaigns: {
        Row: {
          birthday_send_time: string | null
          campaign_type: string
          created_at: string
          filters: Json | null
          id: string
          is_birthday_campaign: boolean
          last_run_at: string | null
          message: string
          name: string
          next_run_at: string | null
          recipient_count: number | null
          schedule_config: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          birthday_send_time?: string | null
          campaign_type?: string
          created_at?: string
          filters?: Json | null
          id?: string
          is_birthday_campaign?: boolean
          last_run_at?: string | null
          message: string
          name: string
          next_run_at?: string | null
          recipient_count?: number | null
          schedule_config?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          birthday_send_time?: string | null
          campaign_type?: string
          created_at?: string
          filters?: Json | null
          id?: string
          is_birthday_campaign?: boolean
          last_run_at?: string | null
          message?: string
          name?: string
          next_run_at?: string | null
          recipient_count?: number | null
          schedule_config?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      thanas: {
        Row: {
          created_at: string
          division_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          division_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          division_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thanas_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          to_account_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          to_account_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          to_account_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_type: "simple" | "variable"
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
      product_type: ["simple", "variable"],
    },
  },
} as const
