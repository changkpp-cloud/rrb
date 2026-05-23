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
      memorials: {
        Row: {
          id: string;
          slug: string;
          name: string;
          birth_date: string;
          death_date: string;
          age: number;
          photo_url: string | null;
          ceremony_date: string;
          ceremony_time: string;
          ceremony_location: string;
          ceremony_hall: string | null;
          bank_name: string;
          bank_account_number: string;
          bank_account_name: string;
          bank_account_image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["memorials"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["memorials"]["Insert"]>;
      };
      donations: {
        Row: {
          id: string;
          memorial_id: string;
          donor_name: string;
          amount: number;
          message: string | null;
          slip_url: string | null;
          status: "pending" | "confirmed" | "rejected";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["donations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["donations"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      donation_status: "pending" | "confirmed" | "rejected";
    };
  };
}

export type Memorial = Database["public"]["Tables"]["memorials"]["Row"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
