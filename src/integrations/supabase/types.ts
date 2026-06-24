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
      feedback_forms: {
        Row: {
          created_at: string
          fdp_title: string
          feedback_button_name: string
          feedback_date: string | null
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          fdp_title: string
          feedback_button_name?: string
          feedback_date?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          fdp_title?: string
          feedback_button_name?: string
          feedback_date?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      feedback_questions: {
        Row: {
          created_at: string
          feedback_form_id: string
          id: string
          options_json: Json
          question_order: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback_form_id: string
          id?: string
          options_json?: Json
          question_order?: number
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback_form_id?: string
          id?: string
          options_json?: Json
          question_order?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_questions_feedback_form_id_fkey"
            columns: ["feedback_form_id"]
            isOneToOne: false
            referencedRelation: "feedback_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_responses: {
        Row: {
          answers_json: Json
          department: string | null
          employee_id: string | null
          feedback_form_id: string
          id: string
          institution_name: string | null
          participant_email: string
          participant_name: string
          submitted_at: string
        }
        Insert: {
          answers_json?: Json
          department?: string | null
          employee_id?: string | null
          feedback_form_id: string
          id?: string
          institution_name?: string | null
          participant_email: string
          participant_name: string
          submitted_at?: string
        }
        Update: {
          answers_json?: Json
          department?: string | null
          employee_id?: string | null
          feedback_form_id?: string
          id?: string
          institution_name?: string | null
          participant_email?: string
          participant_name?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_responses_feedback_form_id_fkey"
            columns: ["feedback_form_id"]
            isOneToOne: false
            referencedRelation: "feedback_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_name: string | null
          external_fee: number
          id: string
          internal_fee: number
          qr_code_url: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_name?: string | null
          external_fee?: number
          id?: string
          internal_fee?: number
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_name?: string | null
          external_fee?: number
          id?: string
          internal_fee?: number
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          category: string
          created_at: string
          custom_department: string | null
          custom_institute: string | null
          department: string
          designation: string
          email: string
          faculty_id: string
          faculty_name: string
          id: string
          institute: string
          payment_screenshot_url: string | null
          payment_status: string
          phone: string
          registration_fee: number
          registration_id: string
          utr_number: string
        }
        Insert: {
          category: string
          created_at?: string
          custom_department?: string | null
          custom_institute?: string | null
          department: string
          designation: string
          email: string
          faculty_id: string
          faculty_name: string
          id?: string
          institute: string
          payment_screenshot_url?: string | null
          payment_status?: string
          phone: string
          registration_fee: number
          registration_id: string
          utr_number: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_department?: string | null
          custom_institute?: string | null
          department?: string
          designation?: string
          email?: string
          faculty_id?: string
          faculty_name?: string
          id?: string
          institute?: string
          payment_screenshot_url?: string | null
          payment_status?: string
          phone?: string
          registration_fee?: number
          registration_id?: string
          utr_number?: string
        }
        Relationships: []
      }
      speakers: {
        Row: {
          created_at: string
          designation: string
          id: string
          name: string
          organization: string | null
          photo_url: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          designation: string
          id?: string
          name: string
          organization?: string | null
          photo_url?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          designation?: string
          id?: string
          name?: string
          organization?: string | null
          photo_url?: string | null
          sort_order?: number
        }
        Relationships: []
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
      website_settings: {
        Row: {
          brochure_url: string | null
          contact_email: string | null
          contact_phone: string | null
          description: string
          fdp_dates: string
          fdp_subtitle: string
          fdp_title: string
          footer_text: string | null
          hero_banner_url: string | null
          id: string
          registration_open: boolean
          seat_limit: number
          updated_at: string
          venue: string
        }
        Insert: {
          brochure_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          description?: string
          fdp_dates?: string
          fdp_subtitle?: string
          fdp_title?: string
          footer_text?: string | null
          hero_banner_url?: string | null
          id?: string
          registration_open?: boolean
          seat_limit?: number
          updated_at?: string
          venue?: string
        }
        Update: {
          brochure_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          description?: string
          fdp_dates?: string
          fdp_subtitle?: string
          fdp_title?: string
          footer_text?: string | null
          hero_banner_url?: string | null
          id?: string
          registration_open?: boolean
          seat_limit?: number
          updated_at?: string
          venue?: string
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
