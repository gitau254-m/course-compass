export interface User {
  id: string;
  first_name: string;
  gender: string;
  age: number;
  phone?: string;
  created_at: string;
}

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
  field: string;
  mean_grade_required: string;
  mean_points_required: number;
  description?: string;
  career_paths?: string[];
  created_at: string;
}

export interface CourseClusterSubject {
  id: string;
  course_id: string;
  subject: string;
  weight: number;
  min_grade?: string;
}

export interface University {
  id: string;
  name: string;
  course_id: string;
  location?: string;
  created_at: string;
}

export interface EligibilityResult {
  id: string;
  user_id: string;
  course_id: string;
  cluster_score: number;
  interest_score: number;
  final_rank: 'High' | 'Medium' | 'Low';
  created_at: string;
  course?: Course;
  universities?: University[];
}

export interface Payment {
  id: string;
  user_id: string;
  phone: string;
  amount: number;
  mpesa_receipt?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

export interface SubjectGrade {
  subject: string;
  grade: string;
  points: number;
}

export interface FormData {
  firstName: string;
  gender: string;
  age: string;
  phone: string;
  compulsorySubjects: SubjectGrade[];
  optionalSubjects: SubjectGrade[];
  interestResponses: Record<string, { answer: string; score: number; fields: string[] }>;
}