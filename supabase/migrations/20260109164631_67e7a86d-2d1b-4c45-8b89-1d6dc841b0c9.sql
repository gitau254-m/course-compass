-- Create users table for storing student information
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    age INTEGER NOT NULL CHECK (age >= 14 AND age <= 100),
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a user (no auth required for this app)
CREATE POLICY "Anyone can create users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (true);

-- Create user_results table for KCSE grades
CREATE TABLE public.user_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E')),
    grade_points INTEGER NOT NULL CHECK (grade_points >= 1 AND grade_points <= 12),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.user_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert results" ON public.user_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view results" ON public.user_results FOR SELECT USING (true);

-- Create interest_responses table
CREATE TABLE public.interest_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.interest_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert interest responses" ON public.interest_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view interest responses" ON public.interest_responses FOR SELECT USING (true);

-- Create courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    field TEXT NOT NULL,
    mean_grade_required TEXT NOT NULL,
    mean_points_required INTEGER NOT NULL,
    description TEXT,
    career_paths TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);

-- Create course_cluster_subjects table
CREATE TABLE public.course_cluster_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    weight DECIMAL(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    min_grade TEXT CHECK (min_grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'))
);

ALTER TABLE public.course_cluster_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cluster subjects" ON public.course_cluster_subjects FOR SELECT USING (true);

-- Create universities table
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT USING (true);

-- Create eligibility_results table
CREATE TABLE public.eligibility_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    cluster_score DECIMAL(5,2) NOT NULL,
    interest_score DECIMAL(5,2) NOT NULL,
    final_rank TEXT NOT NULL CHECK (final_rank IN ('High', 'Medium', 'Low')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.eligibility_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert eligibility results" ON public.eligibility_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view eligibility results" ON public.eligibility_results FOR SELECT USING (true);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    phone TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 70,
    mpesa_receipt TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Anyone can update payments" ON public.payments FOR UPDATE USING (true);