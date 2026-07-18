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
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
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
      combo_items: {
        Row: {
          child_product_id: string
          combo_product_id: string
          created_at: string
          id: string
          quantity: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          child_product_id: string
          combo_product_id: string
          created_at?: string
          id?: string
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          child_product_id?: string
          combo_product_id?: string
          created_at?: string
          id?: string
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_items_child_product_id_fkey"
            columns: ["child_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_items_combo_product_id_fkey"
            columns: ["combo_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          show_member_since: boolean
          show_on_public_page: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          show_member_since?: boolean
          show_on_public_page?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          show_member_since?: boolean
          show_on_public_page?: boolean
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
          membership_assigned_at: string | null
          name: string
          notes: string | null
          phone: string
          postal_code: string | null
          profile_image_url: string | null
          public_profile_visible: boolean
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
          membership_assigned_at?: string | null
          name: string
          notes?: string | null
          phone: string
          postal_code?: string | null
          profile_image_url?: string | null
          public_profile_visible?: boolean
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
          membership_assigned_at?: string | null
          name?: string
          notes?: string | null
          phone?: string
          postal_code?: string | null
          profile_image_url?: string | null
          public_profile_visible?: boolean
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
      inventory_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_entries: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          transaction_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_entry_items: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          inventory_product_id: string | null
          product_id: string | null
          purchase_price: number | null
          quantity: number
          shared_variant_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          inventory_product_id?: string | null
          product_id?: string | null
          purchase_price?: number | null
          quantity?: number
          shared_variant_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          inventory_product_id?: string | null
          product_id?: string | null
          purchase_price?: number | null
          quantity?: number
          shared_variant_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_entry_items_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "inventory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entry_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entry_items_shared_variant_id_fkey"
            columns: ["shared_variant_id"]
            isOneToOne: false
            referencedRelation: "shared_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entry_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
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
      meta_channels: {
        Row: {
          access_token: string | null
          app_id: string | null
          app_secret: string | null
          business_account_id: string | null
          channel: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          notes: string | null
          page_id: string | null
          phone_number_id: string | null
          updated_at: string
          verify_token: string
        }
        Insert: {
          access_token?: string | null
          app_id?: string | null
          app_secret?: string | null
          business_account_id?: string | null
          channel: string
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          page_id?: string | null
          phone_number_id?: string | null
          updated_at?: string
          verify_token: string
        }
        Update: {
          access_token?: string | null
          app_id?: string | null
          app_secret?: string | null
          business_account_id?: string | null
          channel?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          page_id?: string | null
          phone_number_id?: string | null
          updated_at?: string
          verify_token?: string
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
          parent_combo_order_item_id: string | null
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
          parent_combo_order_item_id?: string | null
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
          parent_combo_order_item_id?: string | null
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
            foreignKeyName: "order_items_parent_combo_order_item_id_fkey"
            columns: ["parent_combo_order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
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
          call_center_notes: string | null
          consignment_id: string | null
          courier_name: string | null
          created_at: string
          created_by_source: string
          created_by_user_id: string | null
          currency: string
          customer_called_at: string | null
          customer_id: string | null
          customer_notes: string | null
          delivered_at: string | null
          discount_amount: number
          fulfillment_issue: string | null
          fulfillment_ready: boolean
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
          call_center_notes?: string | null
          consignment_id?: string | null
          courier_name?: string | null
          created_at?: string
          created_by_source?: string
          created_by_user_id?: string | null
          currency?: string
          customer_called_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          delivered_at?: string | null
          discount_amount?: number
          fulfillment_issue?: string | null
          fulfillment_ready?: boolean
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
          call_center_notes?: string | null
          consignment_id?: string | null
          courier_name?: string | null
          created_at?: string
          created_by_source?: string
          created_by_user_id?: string | null
          currency?: string
          customer_called_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          delivered_at?: string | null
          discount_amount?: number
          fulfillment_issue?: string | null
          fulfillment_ready?: boolean
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
      product_applied_attributes: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_applied_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_applied_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          color_id: string | null
          created_at: string
          id: string
          image_url: string
          is_main: boolean
          large_url: string | null
          material_id: string | null
          medium_url: string | null
          product_id: string
          size_id: string | null
          sort_order: number
          thumb_url: string | null
        }
        Insert: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_main?: boolean
          large_url?: string | null
          material_id?: string | null
          medium_url?: string | null
          product_id: string
          size_id?: string | null
          sort_order?: number
          thumb_url?: string | null
        }
        Update: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_main?: boolean
          large_url?: string | null
          material_id?: string | null
          medium_url?: string | null
          product_id?: string
          size_id?: string | null
          sort_order?: number
          thumb_url?: string | null
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
            foreignKeyName: "product_images_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_attribute_values: {
        Row: {
          attribute_id: string
          attribute_value_id: string
          created_at: string
          id: string
          variant_id: string
        }
        Insert: {
          attribute_id: string
          attribute_value_id: string
          created_at?: string
          id?: string
          variant_id: string
        }
        Update: {
          attribute_id?: string
          attribute_value_id?: string
          created_at?: string
          id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_attribute_values_attribute_value_id_fkey"
            columns: ["attribute_value_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_attribute_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_id: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          low_stock_threshold: number
          material_id: string | null
          product_id: string
          purchase_price: number
          selling_price: number
          shared_variant_id: string | null
          size_id: string | null
          sku: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          material_id?: string | null
          product_id: string
          purchase_price?: number
          selling_price?: number
          shared_variant_id?: string | null
          size_id?: string | null
          sku: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          color_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          material_id?: string | null
          product_id?: string
          purchase_price?: number
          selling_price?: number
          shared_variant_id?: string | null
          size_id?: string | null
          sku?: string
          stock_quantity?: number
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
            foreignKeyName: "product_variants_shared_variant_id_fkey"
            columns: ["shared_variant_id"]
            isOneToOne: false
            referencedRelation: "shared_variants"
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
          is_featured: boolean
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
          is_featured?: boolean
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
          is_featured?: boolean
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
      reviews: {
        Row: {
          content: string
          created_at: string
          customer_id: string | null
          id: string
          images: string[] | null
          is_approved: boolean
          is_featured: boolean
          product_id: string
          rating: number
          reviewer_name: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          customer_id?: string | null
          id?: string
          images?: string[] | null
          is_approved?: boolean
          is_featured?: boolean
          product_id: string
          rating: number
          reviewer_name?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          images?: string[] | null
          is_approved?: boolean
          is_featured?: boolean
          product_id?: string
          rating?: number
          reviewer_name?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_variants: {
        Row: {
          category_id: string | null
          color_id: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          low_stock_threshold: number
          material_id: string | null
          purchase_price: number
          size_id: string | null
          sku: string
          stock_quantity: number
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          material_id?: string | null
          purchase_price?: number
          size_id?: string | null
          sku?: string
          stock_quantity?: number
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          material_id?: string | null
          purchase_price?: number
          size_id?: string | null
          sku?: string
          stock_quantity?: number
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_variants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_variants_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_variants_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_variants_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_variants_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_branding: {
        Row: {
          created_at: string
          desktop_hero_url: string | null
          hero_enabled: boolean
          id: string
          logo_url: string | null
          mobile_hero_url: string | null
          site_name: string
          slogan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desktop_hero_url?: string | null
          hero_enabled?: boolean
          id?: string
          logo_url?: string | null
          mobile_hero_url?: string | null
          site_name?: string
          slogan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desktop_hero_url?: string | null
          hero_enabled?: boolean
          id?: string
          logo_url?: string | null
          mobile_hero_url?: string | null
          site_name?: string
          slogan?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          meta_advanced_matching: boolean
          meta_capi_access_token: string | null
          meta_capi_enabled: boolean
          meta_ecommerce_events_enabled: boolean
          meta_pixel_enabled: boolean
          meta_pixel_id: string | null
          meta_test_mode: boolean
          typography: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_advanced_matching?: boolean
          meta_capi_access_token?: string | null
          meta_capi_enabled?: boolean
          meta_ecommerce_events_enabled?: boolean
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          meta_test_mode?: boolean
          typography?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_advanced_matching?: boolean
          meta_capi_access_token?: string | null
          meta_capi_enabled?: boolean
          meta_ecommerce_events_enabled?: boolean
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          meta_test_mode?: boolean
          typography?: Json
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
          shipping_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          division_id: string
          id?: string
          is_active?: boolean
          name: string
          shipping_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          division_id?: string
          id?: string
          is_active?: boolean
          name?: string
          shipping_cost?: number
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
      create_order_atomic: {
        Args: { p_items: Json; p_order: Json }
        Returns: Json
      }
      find_customer_id_by_phone: { Args: { p_phone: string }; Returns: string }
      find_customer_ids_by_phone: {
        Args: { p_phone: string }
        Returns: string[]
      }
      find_product_by_short_id: { Args: { short_id: string }; Returns: string }
      get_my_customer_id: { Args: never; Returns: string }
      get_public_members: {
        Args: { p_customer_type_id?: string }
        Returns: {
          customer_type_id: string
          customer_type_name: string
          id: string
          membership_assigned_at: string
          name: string
          profile_image_url: string
          show_member_since: boolean
        }[]
      }
      get_public_site_settings: {
        Args: never
        Returns: {
          ga4_enabled: boolean
          ga4_measurement_id: string
          id: string
          meta_advanced_matching: boolean
          meta_capi_enabled: boolean
          meta_ecommerce_events_enabled: boolean
          meta_pixel_enabled: boolean
          meta_pixel_id: string
          meta_test_mode: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_orders_lookup: {
        Args: { p_email?: string; p_order_number?: string; p_phone?: string }
        Returns: Json
      }
      upsert_checkout_customer: {
        Args: {
          p_address?: string
          p_division_id?: string
          p_email?: string
          p_gender?: string
          p_name: string
          p_phone: string
          p_thana_id?: string
        }
        Returns: string
      }
      user_has_customer_type: {
        Args: { _customer_type_id: string }
        Returns: boolean
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
      product_type: "simple" | "variable" | "combo"
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
      product_type: ["simple", "variable", "combo"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
