export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      centers: {
        Row: {
          id: string;
          name: string;
          center_code: string | null;
          municipality: string | null;
          tambon: string | null;
          amphoe: string | null;
          province: string | null;
          manager_name: string | null;
          phone: string | null;
          status: "active" | "inactive";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          center_code?: string | null;
          municipality?: string | null;
          tambon?: string | null;
          amphoe?: string | null;
          province?: string | null;
          manager_name?: string | null;
          phone?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          center_code?: string | null;
          municipality?: string | null;
          tambon?: string | null;
          amphoe?: string | null;
          province?: string | null;
          manager_name?: string | null;
          phone?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string;
          phone: string | null;
          auth_provider: "password" | "email" | "line" | "facebook" | "google";
          provider_user_id: string | null;
          password_hash: string | null;
          global_role: "super_admin" | "center_manager" | "center_staff" | "center_viewer" | null;
          status: "pending" | "active" | "suspended" | "rejected";
          approved_by: string | null;
          approved_at: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          display_name: string;
          phone?: string | null;
          auth_provider?: "password" | "email" | "line" | "facebook" | "google";
          provider_user_id?: string | null;
          password_hash?: string | null;
          global_role?: "super_admin" | "center_manager" | "center_staff" | "center_viewer" | null;
          status?: "pending" | "active" | "suspended" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string;
          phone?: string | null;
          auth_provider?: "password" | "email" | "line" | "facebook" | "google";
          provider_user_id?: string | null;
          password_hash?: string | null;
          global_role?: "super_admin" | "center_manager" | "center_staff" | "center_viewer" | null;
          status?: "pending" | "active" | "suspended" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      center_memberships: {
        Row: {
          id: string;
          center_id: string;
          user_id: string;
          role: "super_admin" | "center_manager" | "center_staff" | "center_viewer";
          status: "pending" | "active" | "suspended" | "rejected";
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          center_id: string;
          user_id: string;
          role?: "super_admin" | "center_manager" | "center_staff" | "center_viewer";
          status?: "pending" | "active" | "suspended" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          center_id?: string;
          user_id?: string;
          role?: "super_admin" | "center_manager" | "center_staff" | "center_viewer";
          status?: "pending" | "active" | "suspended" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "center_memberships_center_id_fkey"; columns: ["center_id"]; referencedRelation: "centers"; referencedColumns: ["id"] },
          { foreignKeyName: "center_memberships_user_id_fkey"; columns: ["user_id"]; referencedRelation: "app_users"; referencedColumns: ["id"] }
        ];
      };
      center_user_requests: {
        Row: {
          id: string;
          center_id: string;
          email: string;
          display_name: string;
          phone: string | null;
          requested_role: "super_admin" | "center_manager" | "center_staff" | "center_viewer";
          auth_provider: "password" | "email" | "line" | "facebook" | "google";
          provider_user_id: string | null;
          password_hash: string | null;
          status: "pending" | "active" | "suspended" | "rejected";
          approved_user_id: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          center_id: string;
          email: string;
          display_name: string;
          phone?: string | null;
          requested_role?: "super_admin" | "center_manager" | "center_staff" | "center_viewer";
          auth_provider?: "password" | "email" | "line" | "facebook" | "google";
          provider_user_id?: string | null;
          password_hash?: string | null;
          status?: "pending" | "active" | "suspended" | "rejected";
          approved_user_id?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          center_id?: string;
          email?: string;
          display_name?: string;
          phone?: string | null;
          requested_role?: "super_admin" | "center_manager" | "center_staff" | "center_viewer";
          auth_provider?: "password" | "email" | "line" | "facebook" | "google";
          provider_user_id?: string | null;
          password_hash?: string | null;
          status?: "pending" | "active" | "suspended" | "rejected";
          approved_user_id?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "center_user_requests_center_id_fkey"; columns: ["center_id"]; referencedRelation: "centers"; referencedColumns: ["id"] },
          { foreignKeyName: "center_user_requests_approved_user_id_fkey"; columns: ["approved_user_id"]; referencedRelation: "app_users"; referencedColumns: ["id"] }
        ];
      };
      app_user_sessions: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_hash: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_hash?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "app_user_sessions_user_id_fkey"; columns: ["user_id"]; referencedRelation: "app_users"; referencedColumns: ["id"] }
        ];
      };
      memorials: {
        Row: {
          id: string;
          slug: string;
          center_id: string | null;
          name: string;
          birth_date: string;
          death_date: string;
          age: number;
          photo_url: string | null;
          ceremony_date: string;
          ceremony_time: string;
          ceremony_location: string;
          ceremony_hall: string | null;
          prayer_date: string | null;
          prayer_location: string | null;
          host_name: string | null;
          host_phone: string | null;
          host_code: string | null;
          funeral_status: "draft" | "active" | "closed";
          bank_name: string;
          bank_account_number: string;
          bank_account_name: string;
          bank_account_image_url: string | null;
          is_active: boolean;
          created_at: string;
          event_code: string | null;
          consent_confirmed: boolean;
          host_relationship: string | null;
          host_bank_name: string | null;
          host_bank_account_number: string | null;
          host_bank_account_name: string | null;
          death_certificate_url: string | null;
          host_id_card_url: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          center_id?: string | null;
          name: string;
          birth_date: string;
          death_date: string;
          age: number;
          photo_url?: string | null;
          ceremony_date: string;
          ceremony_time: string;
          ceremony_location: string;
          ceremony_hall?: string | null;
          prayer_date?: string | null;
          prayer_location?: string | null;
          host_name?: string | null;
          host_phone?: string | null;
          host_code?: string | null;
          funeral_status?: "draft" | "active" | "closed";
          bank_name: string;
          bank_account_number: string;
          bank_account_name: string;
          bank_account_image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          event_code?: string | null;
          consent_confirmed?: boolean;
          host_relationship?: string | null;
          host_bank_name?: string | null;
          host_bank_account_number?: string | null;
          host_bank_account_name?: string | null;
          death_certificate_url?: string | null;
          host_id_card_url?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          center_id?: string | null;
          name?: string;
          birth_date?: string;
          death_date?: string;
          age?: number;
          photo_url?: string | null;
          ceremony_date?: string;
          ceremony_time?: string;
          ceremony_location?: string;
          ceremony_hall?: string | null;
          prayer_date?: string | null;
          prayer_location?: string | null;
          host_name?: string | null;
          host_phone?: string | null;
          host_code?: string | null;
          funeral_status?: "draft" | "active" | "closed";
          bank_name?: string;
          bank_account_number?: string;
          bank_account_name?: string;
          bank_account_image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          event_code?: string | null;
          consent_confirmed?: boolean;
          host_relationship?: string | null;
          host_bank_name?: string | null;
          host_bank_account_number?: string | null;
          host_bank_account_name?: string | null;
          death_certificate_url?: string | null;
          host_id_card_url?: string | null;
        };
        Relationships: [
          { foreignKeyName: "memorials_center_id_fkey"; columns: ["center_id"]; referencedRelation: "centers"; referencedColumns: ["id"] }
        ];
      };
      donations: {
        Row: {
          id: string;
          memorial_id: string;
          center_id: string | null;
          donor_name: string;
          donor_title: string | null;
          amount: number;
          message: string | null;
          slip_url: string | null;
          status: "pending" | "confirmed" | "rejected";
          nameplate_status: "pending" | "queued" | "printed" | "posted";
          confirmed_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          center_id?: string | null;
          donor_name: string;
          donor_title?: string | null;
          amount: number;
          message?: string | null;
          slip_url?: string | null;
          status: "pending" | "confirmed" | "rejected";
          nameplate_status?: "pending" | "queued" | "printed" | "posted";
          confirmed_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          center_id?: string | null;
          donor_name?: string;
          donor_title?: string | null;
          amount?: number;
          message?: string | null;
          slip_url?: string | null;
          status?: "pending" | "confirmed" | "rejected";
          nameplate_status?: "pending" | "queued" | "printed" | "posted";
          confirmed_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "donations_memorial_id_fkey"; columns: ["memorial_id"]; referencedRelation: "memorials"; referencedColumns: ["id"] }
        ];
      };
      center_daily_stats: {
        Row: {
          center_id: string;
          report_date: string;
          donation_count: number;
          pending_count: number;
          confirmed_count: number;
          rejected_count: number;
          total_amount: number;
          wreaths_reduced: number;
          waste_reduced_kg: number;
          updated_at: string;
        };
        Insert: {
          center_id: string;
          report_date: string;
          donation_count?: number;
          pending_count?: number;
          confirmed_count?: number;
          rejected_count?: number;
          total_amount?: number;
          wreaths_reduced?: number;
          waste_reduced_kg?: number;
          updated_at?: string;
        };
        Update: {
          center_id?: string;
          report_date?: string;
          donation_count?: number;
          pending_count?: number;
          confirmed_count?: number;
          rejected_count?: number;
          total_amount?: number;
          wreaths_reduced?: number;
          waste_reduced_kg?: number;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "center_daily_stats_center_id_fkey"; columns: ["center_id"]; referencedRelation: "centers"; referencedColumns: ["id"] }
        ];
      };
      nameplates: {
        Row: {
          id: string;
          donation_id: string | null;
          memorial_id: string;
          donor_name: string;
          donor_title: string | null;
          message: string | null;
          pdf_url: string | null;
          print_status: "pending" | "queued" | "printing" | "printed" | "error" | "reprint";
          board_status: "pending" | "posted";
          print_job_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          donation_id?: string | null;
          memorial_id: string;
          donor_name: string;
          donor_title?: string | null;
          message?: string | null;
          pdf_url?: string | null;
          print_status?: "pending" | "queued" | "printing" | "printed" | "error" | "reprint";
          board_status?: "pending" | "posted";
          print_job_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          donation_id?: string | null;
          memorial_id?: string;
          donor_name?: string;
          donor_title?: string | null;
          message?: string | null;
          pdf_url?: string | null;
          print_status?: "pending" | "queued" | "printing" | "printed" | "error" | "reprint";
          board_status?: "pending" | "posted";
          print_job_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "nameplates_memorial_id_fkey"; columns: ["memorial_id"]; referencedRelation: "memorials"; referencedColumns: ["id"] },
          { foreignKeyName: "nameplates_donation_id_fkey"; columns: ["donation_id"]; referencedRelation: "donations"; referencedColumns: ["id"] }
        ];
      };
      print_jobs: {
        Row: {
          id: string;
          nameplate_id: string;
          printer_id: string | null;
          status: "queued" | "printing" | "printed" | "error";
          queued_at: string;
          printed_at: string | null;
          printed_by: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          nameplate_id: string;
          printer_id?: string | null;
          status?: "queued" | "printing" | "printed" | "error";
          queued_at?: string;
          printed_at?: string | null;
          printed_by?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          nameplate_id?: string;
          printer_id?: string | null;
          status?: "queued" | "printing" | "printed" | "error";
          queued_at?: string;
          printed_at?: string | null;
          printed_by?: string | null;
          error_message?: string | null;
        };
        Relationships: [
          { foreignKeyName: "print_jobs_nameplate_id_fkey"; columns: ["nameplate_id"]; referencedRelation: "nameplates"; referencedColumns: ["id"] }
        ];
      };
      equipment: {
        Row: {
          id: string;
          center_id: string;
          type: "board" | "printer" | "flower_box" | "other";
          name: string;
          status: "available" | "in_use" | "maintenance" | "returned";
          current_memorial_id: string | null;
          location: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          center_id: string;
          type: "board" | "printer" | "flower_box" | "other";
          name: string;
          status?: "available" | "in_use" | "maintenance" | "returned";
          current_memorial_id?: string | null;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          center_id?: string;
          type?: "board" | "printer" | "flower_box" | "other";
          name?: string;
          status?: "available" | "in_use" | "maintenance" | "returned";
          current_memorial_id?: string | null;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "equipment_center_id_fkey"; columns: ["center_id"]; referencedRelation: "centers"; referencedColumns: ["id"] }
        ];
      };
      reports: {
        Row: {
          id: string;
          memorial_id: string;
          center_id: string | null;
          total_amount: number;
          donor_count: number;
          service_fee: number;
          net_amount: number;
          wreaths_reduced: number;
          waste_reduced_kg: number;
          closed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          center_id?: string | null;
          total_amount?: number;
          donor_count?: number;
          service_fee?: number;
          net_amount?: number;
          wreaths_reduced?: number;
          waste_reduced_kg?: number;
          closed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          center_id?: string | null;
          total_amount?: number;
          donor_count?: number;
          service_fee?: number;
          net_amount?: number;
          wreaths_reduced?: number;
          waste_reduced_kg?: number;
          closed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "reports_memorial_id_fkey"; columns: ["memorial_id"]; referencedRelation: "memorials"; referencedColumns: ["id"] }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string | null;
          record_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name?: string | null;
          record_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string | null;
          record_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      center_report_totals: {
        Row: {
          center_id: string | null;
          center_name: string | null;
          province: string | null;
          amphoe: string | null;
          center_status: string | null;
          donation_count: number | null;
          pending_count: number | null;
          confirmed_count: number | null;
          rejected_count: number | null;
          total_amount: number | null;
          wreaths_reduced: number | null;
          waste_reduced_kg: number | null;
          updated_at: string | null;
        };
      };
    };
    Functions: {
      refresh_center_daily_stats: {
        Args: { p_center_id: string; p_report_date: string };
        Returns: undefined;
      };
    };
    Enums: {
      donation_status: "pending" | "confirmed" | "rejected";
      nameplate_print_status: "pending" | "queued" | "printing" | "printed" | "error" | "reprint";
      funeral_status: "draft" | "active" | "closed";
      equipment_status: "available" | "in_use" | "maintenance" | "returned";
    };
  };
}

export type Center    = Database["public"]["Tables"]["centers"]["Row"];
export type Memorial  = Database["public"]["Tables"]["memorials"]["Row"];
export type Donation  = Database["public"]["Tables"]["donations"]["Row"];
export type Nameplate = Database["public"]["Tables"]["nameplates"]["Row"];
export type PrintJob  = Database["public"]["Tables"]["print_jobs"]["Row"];
export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
export type Report    = Database["public"]["Tables"]["reports"]["Row"];
export type AuditLog  = Database["public"]["Tables"]["audit_logs"]["Row"];
