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
          weight?: number
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
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      course_cluster_subjects: {
        Row: {
          course_id: string
          id: string
          min_grade: string | null
          subject: string
          weight: number
        }
        Insert: {
          course_id: string
          id?: string
          min_grade?: string | null
          subject: string
          weight: number
        }
        Update: {
          course_id?: string
          id?: string
          min_grade?: string | null
          subject?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_cluster_subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          career_paths: string[] | null
          cluster_id: string | null
          created_at: string
          cutoff_2024: number | null
          description: string | null
          field: string
          id: string
          institution: string | null
          mean_grade_required: string
          mean_points_required: number
          name: string
        }
        Insert: {
          career_paths?: string[] | null
          cluster_id?: string | null
          created_at?: string
          cutoff_2024?: number | null
          description?: string | null
          field: string
          id?: string
          institution?: string | null
          mean_grade_required: string
          mean_points_required: number
          name: string
        }
        Update: {
          career_paths?: string[] | null
          cluster_id?: string | null
          created_at?: string
          cutoff_2024?: number | null
          description?: string | null
          field?: string
          id?: string
          institution?: string | null
          mean_grade_required?: string
          mean_points_required?: number
          name?: string
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
          cluster_score: number
          course_id: string
          created_at: string
          final_rank: string
          id: string
          interest_score: number
          user_id: string
        }
        Insert: {
          cluster_score: number
          course_id: string
          created_at?: string
          final_rank: string
          id?: string
          interest_score: number
          user_id: string
        }
        Update: {
          cluster_score?: number
          course_id?: string
          created_at?: string
          final_rank?: string
          id?: string
          interest_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_results_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
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
          created_at: string
          id: string
          question: string
          score: number
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          score?: number
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
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
          created_at: string
          id: string
          mpesa_receipt: string | null
          phone: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          mpesa_receipt?: string | null
          phone: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mpesa_receipt?: string | null
          phone?: string
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
      universities: {
        Row: {
          course_id: string
          created_at: string
          id: string
          location: string | null
          name: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "universities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cluster_results: {
        Row: {
          cluster_id: string
          cluster_score: number
          created_at: string
          eligibility_status: string
          id: string
          subjects_used: Json
          user_id: string
        }
        Insert: {
          cluster_id: string
          cluster_score: number
          created_at?: string
          eligibility_status: string
          id?: string
          subjects_used: Json
          user_id: string
        }
        Update: {
          cluster_id?: string
          cluster_score?: number
          created_at?: string
          eligibility_status?: string
          id?: string
          subjects_used?: Json
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
          created_at: string
          grade: string
          grade_points: number
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grade: string
          grade_points: number
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          first_name: string
          gender: string
          id: string
          phone: string | null
        }
        Insert: {
          age: number
          created_at?: string
          first_name: string
          gender: string
          id?: string
          phone?: string | null
        }
        Update: {
          age?: number
          created_at?: string
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
    Enums: {},
  },
} as const
