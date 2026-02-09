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
          image_url: string | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
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
      customer_accounts: {
        Row: {
          auth_user_id: string
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_risk_profiles: {
        Row: {
          active_cod_orders: number
          blacklist_reason: string | null
          cancellation_rate: number
          cancelled_orders: number
          cod_disabled: boolean
          completed_orders: number
          created_at: string
          customer_id: string
          failed_payments: number
          id: string
          is_blacklisted: boolean
          last_order_at: string | null
          return_rate: number
          returned_orders: number
          total_orders: number
          updated_at: string
        }
        Insert: {
          active_cod_orders?: number
          blacklist_reason?: string | null
          cancellation_rate?: number
          cancelled_orders?: number
          cod_disabled?: boolean
          completed_orders?: number
          created_at?: string
          customer_id: string
          failed_payments?: number
          id?: string
          is_blacklisted?: boolean
          last_order_at?: string | null
          return_rate?: number
          returned_orders?: number
          total_orders?: number
          updated_at?: string
        }
        Update: {
          active_cod_orders?: number
          blacklist_reason?: string | null
          cancellation_rate?: number
          cancelled_orders?: number
          cod_disabled?: boolean
          completed_orders?: number
          created_at?: string
          customer_id?: string
          failed_payments?: number
          id?: string
          is_blacklisted?: boolean
          last_order_at?: string | null
          return_rate?: number
          returned_orders?: number
          total_orders?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_risk_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      order_items: {
        Row: {
          created_at: string
          fulfilled_quantity: number
          fulfillment_status: Database["public"]["Enums"]["item_fulfillment_status"]
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          returned_quantity: number
          unit_price: number
          updated_at: string
          variant_details: Json | null
          variant_id: string | null
          variant_sku: string | null
        }
        Insert: {
          created_at?: string
          fulfilled_quantity?: number
          fulfillment_status?: Database["public"]["Enums"]["item_fulfillment_status"]
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          returned_quantity?: number
          unit_price: number
          updated_at?: string
          variant_details?: Json | null
          variant_id?: string | null
          variant_sku?: string | null
        }
        Update: {
          created_at?: string
          fulfilled_quantity?: number
          fulfillment_status?: Database["public"]["Enums"]["item_fulfillment_status"]
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          returned_quantity?: number
          unit_price?: number
          updated_at?: string
          variant_details?: Json | null
          variant_id?: string | null
          variant_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_reference: string | null
          recorded_at: string
          recorded_by: string | null
          transaction_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_reference?: string | null
          recorded_at?: string
          recorded_by?: string | null
          transaction_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_reference?: string | null
          recorded_at?: string
          recorded_by?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_status: string
          notes: string | null
          order_id: string
          order_item_id: string | null
          previous_status: string | null
          status_type: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status: string
          notes?: string | null
          order_id: string
          order_item_id?: string | null
          previous_status?: string | null
          status_type: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string
          notes?: string | null
          order_id?: string
          order_item_id?: string | null
          previous_status?: string | null
          status_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_approved_at: string | null
          amount_approved_by: string | null
          collected_amount: number | null
          consignment_id: string | null
          courier_name: string | null
          created_at: string
          currency: string
          customer_id: string | null
          customer_notes: string | null
          delivered_at: string | null
          discount_amount: number
          guest_email: string | null
          guest_phone: string | null
          id: string
          internal_notes: string | null
          ip_address: string | null
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"]
          paid_amount: number
          payment_method_id: string | null
          payment_method_type:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          payment_proof_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_verified_at: string | null
          payment_verified_by: string | null
          risk_flags: Json | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          sender_number: string | null
          shipped_at: string | null
          shipping_address: string
          shipping_city: string | null
          shipping_cost: number
          shipping_division_id: string | null
          shipping_email: string | null
          shipping_name: string
          shipping_phone: string
          shipping_postal_code: string | null
          shipping_thana_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_number: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount_approved_at?: string | null
          amount_approved_by?: string | null
          collected_amount?: number | null
          consignment_id?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_notes?: string | null
          delivered_at?: string | null
          discount_amount?: number
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          internal_notes?: string | null
          ip_address?: string | null
          order_number: string
          order_status?: Database["public"]["Enums"]["order_status"]
          paid_amount?: number
          payment_method_id?: string | null
          payment_method_type?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          payment_proof_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          risk_flags?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          sender_number?: string | null
          shipped_at?: string | null
          shipping_address: string
          shipping_city?: string | null
          shipping_cost?: number
          shipping_division_id?: string | null
          shipping_email?: string | null
          shipping_name: string
          shipping_phone: string
          shipping_postal_code?: string | null
          shipping_thana_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_approved_at?: string | null
          amount_approved_by?: string | null
          collected_amount?: number | null
          consignment_id?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          customer_notes?: string | null
          delivered_at?: string | null
          discount_amount?: number
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          internal_notes?: string | null
          ip_address?: string | null
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"]
          paid_amount?: number
          payment_method_id?: string | null
          payment_method_type?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          payment_proof_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          risk_flags?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          sender_number?: string | null
          shipped_at?: string | null
          shipping_address?: string
          shipping_city?: string | null
          shipping_cost?: number
          shipping_division_id?: string | null
          shipping_email?: string | null
          shipping_name?: string
          shipping_phone?: string
          shipping_postal_code?: string | null
          shipping_thana_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_division_id_fkey"
            columns: ["shipping_division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_thana_id_fkey"
            columns: ["shipping_thana_id"]
            isOneToOne: false
            referencedRelation: "thanas"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_details: Json | null
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          sort_order: number
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at: string
        }
        Insert: {
          account_details?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
          type: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string
        }
        Update: {
          account_details?: Json | null
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["payment_method_type"]
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
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          order_id: string
          order_item_id: string
          processed_at: string | null
          processed_by: string | null
          proof_images: Json | null
          quantity: number
          reason: string
          restock_decision: string | null
          restocked_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id: string
          order_item_id: string
          processed_at?: string | null
          processed_by?: string | null
          proof_images?: Json | null
          quantity?: number
          reason: string
          restock_decision?: string | null
          restocked_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id?: string
          order_item_id?: string
          processed_at?: string | null
          processed_by?: string | null
          proof_images?: Json | null
          quantity?: number
          reason?: string
          restock_decision?: string | null
          restocked_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_batch: number
          error_message: string | null
          id: string
          images_created: number
          products_created: number
          started_at: string | null
          status: string
          total_batches: number
          total_products: number
          variants_created: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_batch?: number
          error_message?: string | null
          id?: string
          images_created?: number
          products_created?: number
          started_at?: string | null
          status?: string
          total_batches?: number
          total_products?: number
          variants_created?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_batch?: number
          error_message?: string | null
          id?: string
          images_created?: number
          products_created?: number
          started_at?: string | null
          status?: string
          total_batches?: number
          total_products?: number
          variants_created?: number
        }
        Relationships: []
      }
      seo_metadata: {
        Row: {
          canonical_url: string | null
          change_frequency: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          focus_keywords: string[] | null
          id: string
          is_dynamic: boolean
          json_ld_type: string | null
          meta_description: string | null
          meta_title: string | null
          no_index: boolean
          og_image: string | null
          page_path: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          change_frequency?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          focus_keywords?: string[] | null
          id?: string
          is_dynamic?: boolean
          json_ld_type?: string | null
          meta_description?: string | null
          meta_title?: string | null
          no_index?: boolean
          og_image?: string | null
          page_path: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          change_frequency?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          focus_keywords?: string[] | null
          id?: string
          is_dynamic?: boolean
          json_ld_type?: string | null
          meta_description?: string | null
          meta_title?: string | null
          no_index?: boolean
          og_image?: string | null
          page_path?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      upsert_seo_path: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_is_dynamic?: boolean
          p_json_ld_type?: string
          p_page_path: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      item_fulfillment_status:
        | "pending"
        | "reserved"
        | "shipped"
        | "delivered"
        | "out_of_stock"
        | "returned"
        | "return_pending"
        | "damaged"
        | "cancelled"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "partially_delivered"
        | "returned"
        | "cancelled"
        | "failed"
        | "rto"
      payment_method_type:
        | "cod"
        | "mobile_banking"
        | "bank_transfer"
        | "card"
        | "online_gateway"
      payment_status:
        | "unpaid"
        | "pending_verification"
        | "paid"
        | "partially_paid"
        | "partially_refunded"
        | "refunded"
        | "failed"
      product_type: "simple" | "variable"
      risk_level: "low" | "medium" | "high"
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
      app_role: ["admin", "moderator", "user"],
      item_fulfillment_status: [
        "pending",
        "reserved",
        "shipped",
        "delivered",
        "out_of_stock",
        "returned",
        "return_pending",
        "damaged",
        "cancelled",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "partially_delivered",
        "returned",
        "cancelled",
        "failed",
        "rto",
      ],
      payment_method_type: [
        "cod",
        "mobile_banking",
        "bank_transfer",
        "card",
        "online_gateway",
      ],
      payment_status: [
        "unpaid",
        "pending_verification",
        "paid",
        "partially_paid",
        "partially_refunded",
        "refunded",
        "failed",
      ],
      product_type: ["simple", "variable"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
