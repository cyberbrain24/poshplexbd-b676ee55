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
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          canonical_url: string | null
          content: string
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          focus_keyword: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          published_at: string | null
          reading_time_minutes: number
          robots_index: boolean
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_name?: string
          canonical_url?: string | null
          content?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          robots_index?: boolean
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_name?: string
          canonical_url?: string | null
          content?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          robots_index?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
          view_count?: number
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
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
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
          account_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          subcategory_id: string | null
          transaction_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          subcategory_id?: string | null
          transaction_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          subcategory_id?: string | null
          transaction_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entries_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
      media_metadata: {
        Row: {
          alt_text: string | null
          bucket_id: string
          created_at: string
          display_name: string | null
          file_path: string
          id: string
          keywords: string[] | null
          meta_description: string | null
          seo_slug: string | null
          title_attribute: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          bucket_id: string
          created_at?: string
          display_name?: string | null
          file_path: string
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          seo_slug?: string | null
          title_attribute?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          bucket_id?: string
          created_at?: string
          display_name?: string | null
          file_path?: string
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          seo_slug?: string | null
          title_attribute?: string | null
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
      meta_conversations: {
        Row: {
          channel: string
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          display_name: string | null
          external_user_id: string
          id: string
          last_message_at: string
          meta_channel_id: string
          updated_at: string
        }
        Insert: {
          channel: string
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          display_name?: string | null
          external_user_id: string
          id?: string
          last_message_at?: string
          meta_channel_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          display_name?: string | null
          external_user_id?: string
          id?: string
          last_message_at?: string
          meta_channel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_conversations_meta_channel_id_fkey"
            columns: ["meta_channel_id"]
            isOneToOne: false
            referencedRelation: "meta_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      music_tracks: {
        Row: {
          created_at: string
          file_path: string
          file_url: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_url: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_url?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
          call_center_notes: string | null
          collected_amount: number | null
          consignment_id: string | null
          courier_name: string | null
          created_at: string
          currency: string
          customer_called_at: string | null
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
          promo_code: string | null
          promo_code_id: string | null
          promo_discount: number | null
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
          call_center_notes?: string | null
          collected_amount?: number | null
          consignment_id?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          customer_called_at?: string | null
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
          promo_code?: string | null
          promo_code_id?: string | null
          promo_discount?: number | null
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
          call_center_notes?: string | null
          collected_amount?: number | null
          consignment_id?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          customer_called_at?: string | null
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
          promo_code?: string | null
          promo_code_id?: string | null
          promo_discount?: number | null
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
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
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
          material_id: string | null
          product_id: string
          size_id: string | null
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_main?: boolean
          material_id?: string | null
          product_id: string
          size_id?: string | null
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_main?: boolean
          material_id?: string | null
          product_id?: string
          size_id?: string | null
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
      product_variant_shared_links: {
        Row: {
          created_at: string
          id: string
          product_variant_id: string
          quantity: number
          shared_variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_variant_id: string
          quantity?: number
          shared_variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_variant_id?: string
          quantity?: number
          shared_variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_shared_links_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_shared_links_shared_variant_id_fkey"
            columns: ["shared_variant_id"]
            isOneToOne: false
            referencedRelation: "shared_variants"
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
      promo_code_usages: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_amount: number
          id: string
          order_id: string | null
          promo_code_id: string
          used_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          promo_code_id: string
          used_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          per_customer_limit: number | null
          reward_membership_type_id: string | null
          reward_trigger: string
          reward_type: string
          starts_at: string | null
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_customer_limit?: number | null
          reward_membership_type_id?: string | null
          reward_trigger?: string
          reward_type?: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_customer_limit?: number | null
          reward_membership_type_id?: string | null
          reward_trigger?: string
          reward_type?: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_reward_membership_type_id_fkey"
            columns: ["reward_membership_type_id"]
            isOneToOne: false
            referencedRelation: "customer_types"
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
          customer_id: string
          id: string
          images: string[] | null
          is_approved: boolean
          product_id: string
          rating: number
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          customer_id: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          customer_id?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          product_id?: string
          rating?: number
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
      shared_variant_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          shared_variant_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          shared_variant_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          shared_variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_variant_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_variant_categories_shared_variant_id_fkey"
            columns: ["shared_variant_id"]
            isOneToOne: false
            referencedRelation: "shared_variants"
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
          anthropic_api_key: string | null
          anthropic_enabled: boolean
          created_at: string
          ga4_enabled: boolean
          ga4_measurement_id: string | null
          gemini_api_key: string | null
          gemini_enabled: boolean
          id: string
          meta_advanced_matching: boolean
          meta_capi_access_token: string | null
          meta_capi_enabled: boolean
          meta_ecommerce_events_enabled: boolean
          meta_pixel_enabled: boolean
          meta_pixel_id: string | null
          meta_test_mode: boolean
          openai_api_key: string | null
          openai_enabled: boolean
          openrouter_api_key: string | null
          openrouter_enabled: boolean
          updated_at: string
        }
        Insert: {
          anthropic_api_key?: string | null
          anthropic_enabled?: boolean
          created_at?: string
          ga4_enabled?: boolean
          ga4_measurement_id?: string | null
          gemini_api_key?: string | null
          gemini_enabled?: boolean
          id?: string
          meta_advanced_matching?: boolean
          meta_capi_access_token?: string | null
          meta_capi_enabled?: boolean
          meta_ecommerce_events_enabled?: boolean
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          meta_test_mode?: boolean
          openai_api_key?: string | null
          openai_enabled?: boolean
          openrouter_api_key?: string | null
          openrouter_enabled?: boolean
          updated_at?: string
        }
        Update: {
          anthropic_api_key?: string | null
          anthropic_enabled?: boolean
          created_at?: string
          ga4_enabled?: boolean
          ga4_measurement_id?: string | null
          gemini_api_key?: string | null
          gemini_enabled?: boolean
          id?: string
          meta_advanced_matching?: boolean
          meta_capi_access_token?: string | null
          meta_capi_enabled?: boolean
          meta_ecommerce_events_enabled?: boolean
          meta_pixel_enabled?: boolean
          meta_pixel_id?: string | null
          meta_test_mode?: boolean
          openai_api_key?: string | null
          openai_enabled?: boolean
          openrouter_api_key?: string | null
          openrouter_enabled?: boolean
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
      sms_campaigns: {
        Row: {
          audience_filter: Json
          body: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          name: string
          recipient_count: number
          sent_count: number
          status: string
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          body: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          name: string
          recipient_count?: number
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          body?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          name?: string
          recipient_count?: number
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_messages: {
        Row: {
          body: string
          campaign_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          order_id: string | null
          phone: string
          provider_response: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          trigger_event: string | null
        }
        Insert: {
          body: string
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          phone: string
          provider_response?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          trigger_event?: string | null
        }
        Update: {
          body?: string
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          phone?: string
          provider_response?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          trigger_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_provider_settings: {
        Row: {
          api_key: string | null
          created_at: string
          enabled: boolean
          endpoint_url: string | null
          headers: Json
          http_method: string
          id: string
          notes: string | null
          provider_name: string
          request_template: Json
          sender_id: string | null
          success_keyword: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          enabled?: boolean
          endpoint_url?: string | null
          headers?: Json
          http_method?: string
          id?: string
          notes?: string | null
          provider_name?: string
          request_template?: Json
          sender_id?: string | null
          success_keyword?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          enabled?: boolean
          endpoint_url?: string | null
          headers?: Json
          http_method?: string
          id?: string
          notes?: string | null
          provider_name?: string
          request_template?: Json
          sender_id?: string | null
          success_keyword?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          event_key: string
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          enabled?: boolean
          event_key: string
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          event_key?: string
          id?: string
          is_system?: boolean
          name?: string
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
      admin_list_schema: { Args: never; Returns: Json }
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
      increment_blog_post_views: {
        Args: { p_slug: string }
        Returns: undefined
      }
      increment_promo_usage: {
        Args: { p_promo_code_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      record_order_payment_atomic: {
        Args: {
          p_account_id: string
          p_amount: number
          p_idempotency_key: string
          p_order_id: string
          p_payment_reference: string
        }
        Returns: Json
      }
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
      blog_post_status: "draft" | "published" | "scheduled"
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
      blog_post_status: ["draft", "published", "scheduled"],
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
