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
        };
        Relationships: [
          { foreignKeyName: "memorials_center_id_fkey"; columns: ["center_id"]; referencedRelation: "centers"; referencedColumns: ["id"] }
        ];
      };
      donations: {
        Row: {
          id: string;
          memorial_id: string;
          donor_name: string;
          donor_title: string | null;
          amount: number;
          message: string | null;
          slip_url: string | null;
          status: "pending" | "confirmed" | "rejected";
          nameplate_status: "pending" | "queued" | "printed" | "posted";
          created_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          donor_name: string;
          donor_title?: string | null;
          amount: number;
          message?: string | null;
          slip_url?: string | null;
          status: "pending" | "confirmed" | "rejected";
          nameplate_status?: "pending" | "queued" | "printed" | "posted";
          created_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          donor_name?: string;
          donor_title?: string | null;
          amount?: number;
          message?: string | null;
          slip_url?: string | null;
          status?: "pending" | "confirmed" | "rejected";
          nameplate_status?: "pending" | "queued" | "printed" | "posted";
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "donations_memorial_id_fkey"; columns: ["memorial_id"]; referencedRelation: "memorials"; referencedColumns: ["id"] }
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
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
