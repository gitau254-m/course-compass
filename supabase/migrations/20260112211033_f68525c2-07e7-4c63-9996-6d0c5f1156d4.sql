-- Create cluster definitions table
CREATE TABLE public.clusters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Create cluster subject requirements table
CREATE TABLE public.cluster_subject_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id TEXT NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('compulsory', 'group1', 'group2', 'group3', 'any')),
  min_grade TEXT,
  weight NUMERIC NOT NULL DEFAULT 1
);

-- Create courses with cluster and cut-off data
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS cluster_id TEXT REFERENCES public.clusters(id);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS cutoff_2024 NUMERIC;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS institution TEXT;

-- Create user cluster results table for storing calculated scores
CREATE TABLE public.user_cluster_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL REFERENCES public.clusters(id),
  cluster_score NUMERIC NOT NULL,
  subjects_used JSONB NOT NULL,
  eligibility_status TEXT NOT NULL CHECK (eligibility_status IN ('likely_eligible', 'borderline', 'not_competitive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_subject_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cluster_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for clusters (public read)
CREATE POLICY "Clusters are viewable by everyone" ON public.clusters FOR SELECT USING (true);
CREATE POLICY "Cluster requirements are viewable by everyone" ON public.cluster_subject_requirements FOR SELECT USING (true);

-- RLS policies for user cluster results
CREATE POLICY "Users can view their own cluster results" ON public.user_cluster_results FOR SELECT USING (true);
CREATE POLICY "Users can insert their own cluster results" ON public.user_cluster_results FOR INSERT WITH CHECK (true);

-- Insert KUCCPS clusters (1-47)
INSERT INTO public.clusters (id, name, description) VALUES
  ('1', 'Cluster 1', 'Medicine, Pharmacy, Dentistry'),
  ('2', 'Cluster 2', 'Engineering & Technology'),
  ('3', 'Cluster 3', 'Architecture, Surveying, Construction'),
  ('4', 'Cluster 4', 'Agriculture, Food Science'),
  ('5', 'Cluster 5', 'Veterinary Medicine'),
  ('6', 'Cluster 6', 'Biological Sciences'),
  ('7', 'Cluster 7', 'Physical Sciences'),
  ('8', 'Cluster 8', 'Geosciences'),
  ('9', 'Cluster 9', 'Mathematics & Computer Science'),
  ('10', 'Cluster 10', 'Environmental Sciences'),
  ('11', 'Cluster 11', 'Education (Science)'),
  ('12', 'Cluster 12', 'Education (Arts)'),
  ('13', 'Cluster 13', 'Law'),
  ('14', 'Cluster 14', 'Social Sciences'),
  ('15', 'Cluster 15', 'Humanities & Languages'),
  ('16', 'Cluster 16', 'Business & Commerce'),
  ('17', 'Cluster 17', 'Economics'),
  ('18', 'Cluster 18', 'Communication & Media'),
  ('19', 'Cluster 19', 'Fine Arts & Design'),
  ('20', 'Cluster 20', 'Music'),
  ('21', 'Cluster 21', 'Hospitality & Tourism'),
  ('22', 'Cluster 22', 'Nursing'),
  ('23', 'Cluster 23', 'Clinical Medicine & Health Sciences');

-- Insert cluster subject requirements for key clusters
-- Cluster 1: Medicine (Bio, Chem, Phys/Math required)
INSERT INTO public.cluster_subject_requirements (cluster_id, subject, category, min_grade, weight) VALUES
  ('1', 'Biology', 'compulsory', 'B+', 2),
  ('1', 'Chemistry', 'compulsory', 'B+', 2),
  ('1', 'Mathematics', 'group1', 'B', 1),
  ('1', 'Physics', 'group1', 'B', 1),
  ('1', 'English', 'compulsory', 'C+', 1);

-- Cluster 2: Engineering
INSERT INTO public.cluster_subject_requirements (cluster_id, subject, category, min_grade, weight) VALUES
  ('2', 'Mathematics', 'compulsory', 'B', 3),
  ('2', 'Physics', 'compulsory', 'B', 2),
  ('2', 'Chemistry', 'group1', 'C+', 1),
  ('2', 'English', 'compulsory', 'C+', 1);

-- Cluster 3: Architecture
INSERT INTO public.cluster_subject_requirements (cluster_id, subject, category, min_grade, weight) VALUES
  ('3', 'Mathematics', 'compulsory', 'B', 2),
  ('3', 'Physics', 'compulsory', 'C+', 2),
  ('3', 'Art & Design', 'group1', NULL, 1),
  ('3', 'Drawing & Design', 'group1', NULL, 1),
  ('3', 'English', 'compulsory', 'C+', 1);

-- Cluster 9: Computer Science
INSERT INTO public.cluster_subject_requirements (cluster_id, subject, category, min_grade, weight) VALUES
  ('9', 'Mathematics', 'compulsory', 'B', 3),
  ('9', 'Physics', 'group1', 'C+', 1),
  ('9', 'Chemistry', 'group1', 'C+', 1),
  ('9', 'English', 'compulsory', 'C+', 1);

-- Cluster 13: Law
INSERT INTO public.cluster_subject_requirements (cluster_id, subject, category, min_grade, weight) VALUES
  ('13', 'English', 'compulsory', 'B', 3),
  ('13', 'Kiswahili', 'compulsory', 'C+', 1),
  ('13', 'History', 'group1', 'C+', 1),
  ('13', 'CRE', 'group1', 'C+', 1),
  ('13', 'Geography', 'group1', 'C+', 1);

-- Cluster 16: Business
INSERT INTO public.cluster_subject_requirements (cluster_id, subject, category, min_grade, weight) VALUES
  ('16', 'Mathematics', 'compulsory', 'C+', 2),
  ('16', 'English', 'compulsory', 'C+', 2),
  ('16', 'Business Studies', 'group1', NULL, 1),
  ('16', 'Geography', 'group1', NULL, 1);

-- Cluster 22: Nursing
INSERT INTO public.cluster_subject_requirements (cluster_id, subject, category, min_grade, weight) VALUES
  ('22', 'Biology', 'compulsory', 'B-', 2),
  ('22', 'Chemistry', 'compulsory', 'C+', 2),
  ('22', 'Mathematics', 'group1', 'C', 1),
  ('22', 'Physics', 'group1', 'C', 1),
  ('22', 'English', 'compulsory', 'C+', 1);

-- Clear existing courses and add real ones with cut-offs
DELETE FROM public.universities;
DELETE FROM public.eligibility_results;
DELETE FROM public.course_cluster_subjects;
DELETE FROM public.courses;

-- Insert courses with 2024 cut-off points
INSERT INTO public.courses (name, field, mean_grade_required, mean_points_required, cluster_id, cutoff_2024, institution, description, career_paths) VALUES
  ('Bachelor of Medicine and Surgery', 'Health', 'A-', 11, '1', 45.5, 'University of Nairobi', 'Train to become a medical doctor', ARRAY['Doctor', 'Surgeon', 'Medical Researcher']),
  ('Bachelor of Medicine and Surgery', 'Health', 'A-', 11, '1', 44.8, 'Kenyatta University', 'Train to become a medical doctor', ARRAY['Doctor', 'Surgeon', 'Medical Researcher']),
  ('Bachelor of Medicine and Surgery', 'Health', 'A-', 11, '1', 44.2, 'Moi University', 'Train to become a medical doctor', ARRAY['Doctor', 'Surgeon', 'Medical Researcher']),
  ('Bachelor of Pharmacy', 'Health', 'A-', 11, '1', 42.3, 'University of Nairobi', 'Pharmaceutical sciences and drug development', ARRAY['Pharmacist', 'Pharmaceutical Researcher', 'Drug Regulatory Officer']),
  ('Bachelor of Dental Surgery', 'Health', 'A-', 11, '1', 43.8, 'University of Nairobi', 'Dental health and surgery', ARRAY['Dentist', 'Oral Surgeon', 'Dental Researcher']),
  
  ('Bachelor of Engineering (Civil)', 'Engineering', 'B+', 10, '2', 39.5, 'University of Nairobi', 'Design and build infrastructure', ARRAY['Civil Engineer', 'Construction Manager', 'Urban Planner']),
  ('Bachelor of Engineering (Electrical)', 'Engineering', 'B+', 10, '2', 40.2, 'University of Nairobi', 'Electrical systems and power engineering', ARRAY['Electrical Engineer', 'Power Systems Engineer', 'Electronics Engineer']),
  ('Bachelor of Engineering (Mechanical)', 'Engineering', 'B+', 10, '2', 39.8, 'Jomo Kenyatta University', 'Mechanical systems design', ARRAY['Mechanical Engineer', 'Product Designer', 'Manufacturing Engineer']),
  
  ('Bachelor of Architecture', 'Architecture', 'B', 9, '3', 36.5, 'University of Nairobi', 'Design buildings and urban spaces', ARRAY['Architect', 'Urban Designer', 'Interior Designer']),
  ('Bachelor of Quantity Surveying', 'Architecture', 'B-', 8, '3', 33.2, 'Jomo Kenyatta University', 'Construction cost management', ARRAY['Quantity Surveyor', 'Cost Consultant', 'Project Manager']),
  
  ('Bachelor of Computer Science', 'IT', 'B', 9, '9', 37.8, 'University of Nairobi', 'Software development and computing', ARRAY['Software Developer', 'Data Scientist', 'IT Consultant']),
  ('Bachelor of Computer Science', 'IT', 'B', 9, '9', 36.5, 'Jomo Kenyatta University', 'Software development and computing', ARRAY['Software Developer', 'Data Scientist', 'IT Consultant']),
  ('Bachelor of Information Technology', 'IT', 'B-', 8, '9', 34.2, 'Kenyatta University', 'IT systems and management', ARRAY['IT Manager', 'Systems Analyst', 'Network Administrator']),
  
  ('Bachelor of Laws (LLB)', 'Law', 'B+', 10, '13', 41.5, 'University of Nairobi', 'Legal studies and practice', ARRAY['Lawyer', 'Judge', 'Legal Consultant']),
  ('Bachelor of Laws (LLB)', 'Law', 'B+', 10, '13', 40.8, 'Moi University', 'Legal studies and practice', ARRAY['Lawyer', 'Judge', 'Legal Consultant']),
  ('Bachelor of Laws (LLB)', 'Law', 'B+', 10, '13', 40.2, 'Kenyatta University', 'Legal studies and practice', ARRAY['Lawyer', 'Judge', 'Legal Consultant']),
  
  ('Bachelor of Commerce', 'Business', 'B', 9, '16', 35.5, 'University of Nairobi', 'Business administration and commerce', ARRAY['Accountant', 'Business Analyst', 'Marketing Manager']),
  ('Bachelor of Commerce', 'Business', 'B-', 8, '16', 33.8, 'Kenyatta University', 'Business administration and commerce', ARRAY['Accountant', 'Business Analyst', 'Marketing Manager']),
  ('Bachelor of Business Administration', 'Business', 'B-', 8, '16', 32.5, 'Jomo Kenyatta University', 'Business management', ARRAY['Business Manager', 'Entrepreneur', 'Operations Manager']),
  
  ('Bachelor of Nursing', 'Health', 'B-', 8, '22', 34.8, 'University of Nairobi', 'Healthcare and patient care', ARRAY['Nurse', 'Healthcare Manager', 'Clinical Specialist']),
  ('Bachelor of Nursing', 'Health', 'B-', 8, '22', 33.5, 'Moi University', 'Healthcare and patient care', ARRAY['Nurse', 'Healthcare Manager', 'Clinical Specialist']),
  ('Bachelor of Nursing', 'Health', 'C+', 7, '22', 32.2, 'Kenyatta University', 'Healthcare and patient care', ARRAY['Nurse', 'Healthcare Manager', 'Clinical Specialist']),
  
  ('Bachelor of Education (Science)', 'Education', 'C+', 7, '11', 28.5, 'Kenyatta University', 'Teach science subjects in schools', ARRAY['Teacher', 'Education Administrator', 'Curriculum Developer']),
  ('Bachelor of Education (Arts)', 'Education', 'C+', 7, '12', 27.8, 'Kenyatta University', 'Teach arts subjects in schools', ARRAY['Teacher', 'Education Administrator', 'Curriculum Developer']),
  ('Bachelor of Education (Science)', 'Education', 'C+', 7, '11', 27.2, 'Moi University', 'Teach science subjects in schools', ARRAY['Teacher', 'Education Administrator', 'Curriculum Developer']);

-- Create index for faster lookups
CREATE INDEX idx_cluster_requirements ON public.cluster_subject_requirements(cluster_id);
CREATE INDEX idx_user_cluster_results ON public.user_cluster_results(user_id);
CREATE INDEX idx_courses_cluster ON public.courses(cluster_id);