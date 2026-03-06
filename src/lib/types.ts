// ─── Core domain types ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  first_name: string;
  gender: string;
  age: number;
  phone?: string | null;
  email?: string | null;
  auth_user_id?: string | null;
  created_at: string;
}

export interface SubjectGrade {
  subject: string;
  grade: string;
  points: number;
}

export interface Payment {
  id: string;
  user_id: string;
  phone: string;
  amount: number;
  mpesa_receipt?: string | null;
  status: string;
  created_at: string;
}

/** Matches the actual eligibility_results DB schema */
export interface EligibilityResult {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  university: string;
  cluster_code: string;
  cluster_score: number;
  course_cutoff: number;
  status: string;
  created_at?: string | null;
}

// ─── Legacy types (kept for backward compatibility) ────────────────────────────

export interface UserResult {
  id: string;
  user_id: string;
  subject: string;
  grade: string;
  grade_points: number;
  created_at: string;
}

export interface InterestResponse {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  score: number;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  field: string | null;
  mean_grade_required?: string | null;
  mean_points_required?: number | null;
  description?: string | null;
  cluster_id?: string | null;
  cutoff_2024?: number | null;
  cutoff_2023?: number | null;
  institution?: string | null;
  programme_code?: string | null;
  institution_type?: string | null;
  county?: string | null;
  cluster_weight?: number | null;
}

export interface FormData {
  firstName: string;
  gender: string;
  age: string;
  phone: string;
  compulsorySubjects: SubjectGrade[];
  optionalSubjects: SubjectGrade[];
  // Using Record<string, any> to accommodate both old and new interest response shapes
  interestResponses: Record<string, any>;
}