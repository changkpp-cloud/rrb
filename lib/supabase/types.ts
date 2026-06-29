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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_photo_credits: {
        Row: {
          created_at: string
          donation_id: string
          free_quota: number
          id: string
          updated_at: string
          used_count: number
        }
        Insert: {
          created_at?: string
          donation_id: string
          free_quota?: number
          id?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          created_at?: string
          donation_id?: string
          free_quota?: number
          id?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      ai_photo_templates: {
        Row: {
          id: string
          template_key: string
          template_name: string
          description: string
          prompt_template: string
          negative_prompt: string
          required_inputs: string[]
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_key: string
          template_name: string
          description?: string
          prompt_template: string
          negative_prompt?: string
          required_inputs?: string[]
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_key?: string
          template_name?: string
          description?: string
          prompt_template?: string
          negative_prompt?: string
          required_inputs?: string[]
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_photo_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          donation_id: string | null
          error_message: string | null
          final_prompt: string | null
          generated_image_url: string | null
          id: string
          memorial_id: string | null
          reference_image_url: string | null
          status: string
          template_key: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          donation_id?: string | null
          error_message?: string | null
          final_prompt?: string | null
          generated_image_url?: string | null
          id?: string
          memorial_id?: string | null
          reference_image_url?: string | null
          status?: string
          template_key: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          donation_id?: string | null
          error_message?: string | null
          final_prompt?: string | null
          generated_image_url?: string | null
          id?: string
          memorial_id?: string | null
          reference_image_url?: string | null
          status?: string
          template_key?: string
        }
        Relationships: []
      }
      app_user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auth_provider: Database["public"]["Enums"]["auth_provider"]
          created_at: string
          display_name: string
          email: string | null
          global_role: Database["public"]["Enums"]["app_user_role"] | null
          id: string
          last_login_at: string | null
          password_hash: string | null
          phone: string | null
          provider_user_id: string | null
          status: Database["public"]["Enums"]["app_user_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          created_at?: string
          display_name: string
          email?: string | null
          global_role?: Database["public"]["Enums"]["app_user_role"] | null
          id?: string
          last_login_at?: string | null
          password_hash?: string | null
          phone?: string | null
          provider_user_id?: string | null
          status?: Database["public"]["Enums"]["app_user_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          created_at?: string
          display_name?: string
          email?: string | null
          global_role?: Database["public"]["Enums"]["app_user_role"] | null
          id?: string
          last_login_at?: string | null
          password_hash?: string | null
          phone?: string | null
          provider_user_id?: string | null
          status?: Database["public"]["Enums"]["app_user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          actor_role: string | null
          actor_user_id: string | null
          center_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          center_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          center_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      center_memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          center_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_user_role"]
          status: Database["public"]["Enums"]["app_user_status"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          center_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_user_role"]
          status?: Database["public"]["Enums"]["app_user_status"]
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          center_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_user_role"]
          status?: Database["public"]["Enums"]["app_user_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_memberships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_memberships_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      center_user_requests: {
        Row: {
          approved_user_id: string | null
          auth_provider: Database["public"]["Enums"]["auth_provider"]
          center_id: string
          created_at: string
          display_name: string
          email: string
          id: string
          password_hash: string | null
          phone: string | null
          provider_user_id: string | null
          requested_role: Database["public"]["Enums"]["app_user_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["app_user_status"]
        }
        Insert: {
          approved_user_id?: string | null
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          center_id: string
          created_at?: string
          display_name: string
          email: string
          id?: string
          password_hash?: string | null
          phone?: string | null
          provider_user_id?: string | null
          requested_role?: Database["public"]["Enums"]["app_user_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["app_user_status"]
        }
        Update: {
          approved_user_id?: string | null
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          center_id?: string
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          password_hash?: string | null
          phone?: string | null
          provider_user_id?: string | null
          requested_role?: Database["public"]["Enums"]["app_user_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["app_user_status"]
        }
        Relationships: [
          {
            foreignKeyName: "center_user_requests_approved_user_id_fkey"
            columns: ["approved_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_user_requests_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_user_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          access_code: string | null
          amphoe: string | null
          bank_account_image_url: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          center_code: string | null
          created_at: string
          id: string
          manager_name: string | null
          municipality: string | null
          name: string
          official_lgo_code: string | null
          phone: string | null
          province: string | null
          status: string
          tambon: string | null
        }
        Insert: {
          access_code?: string | null
          amphoe?: string | null
          bank_account_image_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          center_code?: string | null
          created_at?: string
          id?: string
          manager_name?: string | null
          municipality?: string | null
          name: string
          official_lgo_code?: string | null
          phone?: string | null
          province?: string | null
          status?: string
          tambon?: string | null
        }
        Update: {
          access_code?: string | null
          amphoe?: string | null
          bank_account_image_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          center_code?: string | null
          created_at?: string
          id?: string
          manager_name?: string | null
          municipality?: string | null
          name?: string
          official_lgo_code?: string | null
          phone?: string | null
          province?: string | null
          status?: string
          tambon?: string | null
        }
        Relationships: []
      }
      ceremony_stats: {
        Row: {
          confirmed_donations: number
          last_donation_at: string | null
          memorial_id: string
          pending_donations: number
          rejected_donations: number
          total_amount: number
          total_donations: number
          updated_at: string
          wreaths_reduced: number
        }
        Insert: {
          confirmed_donations?: number
          last_donation_at?: string | null
          memorial_id: string
          pending_donations?: number
          rejected_donations?: number
          total_amount?: number
          total_donations?: number
          updated_at?: string
          wreaths_reduced?: number
        }
        Update: {
          confirmed_donations?: number
          last_donation_at?: string | null
          memorial_id?: string
          pending_donations?: number
          rejected_donations?: number
          total_amount?: number
          total_donations?: number
          updated_at?: string
          wreaths_reduced?: number
        }
        Relationships: [
          {
            foreignKeyName: "ceremony_stats_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: true
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          center_id: string | null
          confirmed_at: string | null
          created_at: string
          donor_name: string
          donor_title: string | null
          id: string
          memorial_id: string
          message: string | null
          nameplate_status: string
          slip_duplicate_warning: boolean | null
          slip_hash: string | null
          slip_url: string | null
          status: Database["public"]["Enums"]["donation_status"]
        }
        Insert: {
          amount?: number
          center_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          donor_name: string
          donor_title?: string | null
          id?: string
          memorial_id: string
          message?: string | null
          nameplate_status?: string
          slip_duplicate_warning?: boolean | null
          slip_hash?: string | null
          slip_url?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
        }
        Update: {
          amount?: number
          center_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          donor_name?: string
          donor_title?: string | null
          id?: string
          memorial_id?: string
          message?: string | null
          nameplate_status?: string
          slip_duplicate_warning?: boolean | null
          slip_hash?: string | null
          slip_url?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donations_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_persons: {
        Row: {
          allow_in_sim: boolean
          created_at: string
          display_name: string
          id: string
          is_primary: boolean
          memorial_id: string
          photo_url: string | null
          relationship: string
          role_in_photo: string
          sort_order: number
        }
        Insert: {
          allow_in_sim?: boolean
          created_at?: string
          display_name: string
          id?: string
          is_primary?: boolean
          memorial_id: string
          photo_url?: string | null
          relationship: string
          role_in_photo?: string
          sort_order?: number
        }
        Update: {
          allow_in_sim?: boolean
          created_at?: string
          display_name?: string
          id?: string
          is_primary?: boolean
          memorial_id?: string
          photo_url?: string | null
          relationship?: string
          role_in_photo?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "memorial_persons_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      memorials: {
        Row: {
          age: number
          bank_account_image_url: string | null
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          birth_date: string
          center_id: string | null
          ceremony_date: string
          ceremony_hall: string | null
          ceremony_location: string
          ceremony_time: string
          created_at: string
          death_certificate_url: string | null
          death_date: string
          event_code: string | null
          funeral_status: string
          host_bank_account_name: string | null
          host_bank_account_number: string | null
          host_bank_name: string | null
          host_code: string | null
          host_expires_at: string | null
          host_verified: boolean | null
          host_phone_verified: boolean | null
          host_otp_code: string | null
          host_otp_expires_at: string | null
          printer_id: string | null
          transfer_confirmed_at: string | null
          transfer_confirmed_by: string | null
          host_id_card_url: string | null
          host_name: string | null
          host_phone: string | null
          host_relationship: string | null
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          prayer_date: string | null
          prayer_location: string | null
          slug: string
        }
        Insert: {
          age: number
          bank_account_image_url?: string | null
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          birth_date: string
          center_id?: string | null
          ceremony_date: string
          ceremony_hall?: string | null
          ceremony_location: string
          ceremony_time: string
          created_at?: string
          death_certificate_url?: string | null
          death_date: string
          event_code?: string | null
          funeral_status?: string
          host_bank_account_name?: string | null
          host_bank_account_number?: string | null
          host_bank_name?: string | null
          host_code?: string | null
          host_expires_at?: string | null
          host_verified?: boolean | null
          host_phone_verified?: boolean | null
          host_otp_code?: string | null
          host_otp_expires_at?: string | null
          printer_id?: string | null
          transfer_confirmed_at?: string | null
          transfer_confirmed_by?: string | null
          host_id_card_url?: string | null
          host_name?: string | null
          host_phone?: string | null
          host_relationship?: string | null
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          prayer_date?: string | null
          prayer_location?: string | null
          slug: string
        }
        Update: {
          age?: number
          bank_account_image_url?: string | null
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          birth_date?: string
          center_id?: string | null
          ceremony_date?: string
          ceremony_hall?: string | null
          ceremony_location?: string
          ceremony_time?: string
          created_at?: string
          death_certificate_url?: string | null
          death_date?: string
          event_code?: string | null
          funeral_status?: string
          host_bank_account_name?: string | null
          host_bank_account_number?: string | null
          host_bank_name?: string | null
          host_code?: string | null
          host_expires_at?: string | null
          host_verified?: boolean | null
          host_phone_verified?: boolean | null
          host_otp_code?: string | null
          host_otp_expires_at?: string | null
          printer_id?: string | null
          transfer_confirmed_at?: string | null
          transfer_confirmed_by?: string | null
          host_id_card_url?: string | null
          host_name?: string | null
          host_phone?: string | null
          host_relationship?: string | null
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          prayer_date?: string | null
          prayer_location?: string | null
          slug?: string
        }
        Relationships: []
      }
      outbox_jobs: {
        Row: {
          attempts: number
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number
          payload: Record<string, unknown>
          scheduled_at: string
          status: string
        }
        Insert: {
          attempts?: number
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          job_type: string
          last_error?: string | null
          max_attempts?: number
          payload?: Record<string, unknown>
          scheduled_at?: string
          status?: string
        }
        Update: {
          attempts?: number
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          job_type?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Record<string, unknown>
          scheduled_at?: string
          status?: string
        }
        Relationships: []
      }
      slip_submissions: {
        Row: {
          id: string
          memorial_id: string
          slip_hash: string
          slip_url: string | null
          duplicate_detected: boolean
          duplicate_of: string | null
          review_status: string
          first_seen_at: string
          created_at: string
        }
        Insert: {
          id?: string
          memorial_id: string
          slip_hash: string
          slip_url?: string | null
          duplicate_detected?: boolean
          duplicate_of?: string | null
          review_status?: string
          first_seen_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          memorial_id?: string
          slip_hash?: string
          slip_url?: string | null
          duplicate_detected?: boolean
          duplicate_of?: string | null
          review_status?: string
          first_seen_at?: string
          created_at?: string
        }
        Relationships: []
      }
      center_daily_stats: {
        Row: {
          id: string
          center_id: string
          report_date: string
          donation_count: number
          pending_count: number
          confirmed_count: number
          rejected_count: number
          confirmed_donations: number
          total_amount: number
          wreaths_reduced: number
          waste_reduced_kg: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          center_id: string
          report_date: string
          donation_count?: number
          pending_count?: number
          confirmed_count?: number
          rejected_count?: number
          confirmed_donations?: number
          total_amount?: number
          wreaths_reduced?: number
          waste_reduced_kg?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          center_id?: string
          report_date?: string
          donation_count?: number
          pending_count?: number
          confirmed_count?: number
          rejected_count?: number
          confirmed_donations?: number
          total_amount?: number
          wreaths_reduced?: number
          waste_reduced_kg?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      center_report_totals: {
        Row: {
          center_id: string
          donation_count: number
          pending_count: number
          confirmed_count: number
          rejected_count: number
          total_amount: number
          wreaths_reduced: number
          waste_reduced_kg: number
          updated_at: string | null
        }
        Insert: {
          center_id: string
          donation_count?: number
          pending_count?: number
          confirmed_count?: number
          rejected_count?: number
          total_amount?: number
          wreaths_reduced?: number
          waste_reduced_kg?: number
          updated_at?: string | null
        }
        Update: {
          center_id?: string
          donation_count?: number
          pending_count?: number
          confirmed_count?: number
          rejected_count?: number
          total_amount?: number
          wreaths_reduced?: number
          waste_reduced_kg?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      print_jobs: {
        Row: {
          id: string
          status: string
          error_message: string | null
          queued_at: string
          created_at: string
        }
        Insert: {
          id?: string
          status?: string
          error_message?: string | null
          queued_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          status?: string
          error_message?: string | null
          queued_at?: string
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          donation_id: string
          id: string
          metadata: Json | null
          provider: string
          provider_ref: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          donation_id: string
          id?: string
          metadata?: Json | null
          provider: string
          provider_ref: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          donation_id?: string
          id?: string
          metadata?: Json | null
          provider?: string
          provider_ref?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_stats: {
        Row: {
          active_memorials: number
          center_id: string
          closed_memorials: number
          confirmed_donations: number
          total_amount: number
          total_donations: number
          total_memorials: number
          updated_at: string
          wreaths_reduced: number
        }
        Insert: {
          active_memorials?: number
          center_id: string
          closed_memorials?: number
          confirmed_donations?: number
          total_amount?: number
          total_donations?: number
          total_memorials?: number
          updated_at?: string
          wreaths_reduced?: number
        }
        Update: {
          active_memorials?: number
          center_id?: string
          closed_memorials?: number
          confirmed_donations?: number
          total_amount?: number
          total_donations?: number
          total_memorials?: number
          updated_at?: string
          wreaths_reduced?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_stats_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: true
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      refresh_center_daily_stats: {
        Args: { p_center_id: string; p_report_date: string }
        Returns: undefined
      }
      claim_outbox_jobs: {
        Args: { p_batch_size?: number }
        Returns: {
          attempts: number
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number
          payload: Json
          scheduled_at: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "outbox_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      confirm_donation: {
        Args: {
          p_amount: number
          p_donation_id: string
          p_metadata?: Record<string, unknown>
          p_provider: string
          p_provider_ref: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_user_role:
        | "super_admin"
        | "center_manager"
        | "center_staff"
        | "center_viewer"
      app_user_status: "pending" | "active" | "suspended" | "rejected"
      auth_provider: "password" | "email" | "line" | "facebook" | "google"
      donation_status: "pending" | "confirmed" | "rejected"
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
      app_user_role: [
        "super_admin",
        "center_manager",
        "center_staff",
        "center_viewer",
      ],
      app_user_status: ["pending", "active", "suspended", "rejected"],
      auth_provider: ["password", "email", "line", "facebook", "google"],
      donation_status: ["pending", "confirmed", "rejected"],
    },
  },
} as const

// Convenience row-type aliases used across the codebase
export type Memorial = Database["public"]["Tables"]["memorials"]["Row"]
export type Donation = Database["public"]["Tables"]["donations"]["Row"]
export type Center = Database["public"]["Tables"]["centers"]["Row"]
