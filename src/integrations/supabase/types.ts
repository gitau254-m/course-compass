export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cluster_subject_requirements: {
        Row: {
          category: string
          cluster_id: string
          id: string
          min_grade: string | null
          subject: string
          weight: number
        }
        Insert: {
          category: string
          cluster_id: string
          id?: string
          min_grade?: string | null
          subject: string
          weight: number
        }
        Update: {
          category?: string
          cluster_id?: string
          id?: string
          min_grade?: string | null
          subject?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "cluster_subject_requirements_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          cluster_code: string | null
          code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          cluster_code?: string | null
          code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          cluster_code?: string | null
          code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          cluster_id: string
          cluster_weight: number | null
          county: string | null
          created_at: string | null
          cutoff_2023: number | null
          cutoff_2024: number | null
          cutoff_2025: number | null
          description: string | null
          field: string | null
          id: string
          institution: string
          institution_type: string | null
          mean_grade_required: string | null
          mean_points_required: number | null
          name: string
          programme_code: string | null
        }
        Insert: {
          cluster_id: string
          cluster_weight?: number | null
          county?: string | null
          created_at?: string | null
          cutoff_2023?: number | null
          cutoff_2024?: number | null
          cutoff_2025?: number | null
          description?: string | null
          field?: string | null
          id?: string
          institution: string
          institution_type?: string | null
          mean_grade_required?: string | null
          mean_points_required?: number | null
          name: string
          programme_code?: string | null
        }
        Update: {
          cluster_id?: string
          cluster_weight?: number | null
          county?: string | null
          created_at?: string | null
          cutoff_2023?: number | null
          cutoff_2024?: number | null
          cutoff_2025?: number | null
          description?: string | null
          field?: string | null
          id?: string
          institution?: string
          institution_type?: string | null
          mean_grade_required?: string | null
          mean_points_required?: number | null
          name?: string
          programme_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_results: {
        Row: {
          cluster_code: string
          cluster_score: number
          course_cutoff: number
          course_id: string
          course_name: string
          created_at: string | null
          id: string
          status: string
          university: string
          user_id: string
        }
        Insert: {
          cluster_code: string
          cluster_score: number
          course_cutoff: number
          course_id: string
          course_name: string
          created_at?: string | null
          id?: string
          status: string
          university: string
          user_id: string
        }
        Update: {
          cluster_code?: string
          cluster_score?: number
          course_cutoff?: number
          course_id?: string
          course_name?: string
          created_at?: string | null
          id?: string
          status?: string
          university?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_responses: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          question: string
          score: number
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          question: string
          score: number
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          question?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string | null
          id: string
          intasend_state: string | null
          invoice_id: string | null
          mpesa_receipt: string | null
          phone: string
          provider: string
          reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          intasend_state?: string | null
          invoice_id?: string | null
          mpesa_receipt?: string | null
          phone: string
          provider?: string
          reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          intasend_state?: string | null
          invoice_id?: string | null
          mpesa_receipt?: string | null
          phone?: string
          provider?: string
          reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cluster_results: {
        Row: {
          cluster_id: string
          cluster_score: number
          created_at: string | null
          eligibility_status: string
          id: string
          subjects_used: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          cluster_id: string
          cluster_score: number
          created_at?: string | null
          eligibility_status?: string
          id?: string
          subjects_used: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          cluster_id?: string
          cluster_score?: number
          created_at?: string | null
          eligibility_status?: string
          id?: string
          subjects_used?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cluster_results_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cluster_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_results: {
        Row: {
          created_at: string | null
          grade: string
          grade_points: number
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          grade: string
          grade_points: number
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          grade?: string
          grade_points?: number
          id?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age: number
          auth_user_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          gender: string
          id: string
          phone: string | null
        }
        Insert: {
          age: number
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          gender: string
          id?: string
          phone?: string | null
        }
        Update: {
          age?: number
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          gender?: string
          id?: string
          phone?: string | null
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const