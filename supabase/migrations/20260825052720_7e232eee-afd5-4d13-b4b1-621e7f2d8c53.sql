-- ProjectMatch: profiles table + RLS + seed data

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'industry')),
  college_name TEXT,
  branch TEXT,
  year_of_study TEXT,
  "current_role" TEXT,
  years_of_experience INTEGER,
  company TEXT,
  role_category TEXT CHECK (role_category IN ('Developer', 'Designer', 'Data/ML', 'Product', 'Other')),
  skills TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT CHECK (availability IN ('Full-time', 'Part-time <10hrs/week', 'Weekends only')),
  work_mode TEXT CHECK (work_mode IN ('remote', 'in-person')),
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed auth users (password for all: password123)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) VALUES
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aisha.verma@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Aisha Verma"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rahul.menon@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Rahul Menon"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sneha.kulkarni@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Sneha Kulkarni"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arjun.nair@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Arjun Nair"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.sharma@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Priya Sharma"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vikram.reddy@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Vikram Reddy"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ananya.iyer@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ananya Iyer"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karthik.subramanian@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Karthik Subramanian"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meera.joshi@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Meera Joshi"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev.patel@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Dev Patel"}', now(), now());

INSERT INTO auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '{"sub":"a0000000-0000-4000-8000-000000000001","email":"aisha.verma@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '{"sub":"a0000000-0000-4000-8000-000000000002","email":"rahul.menon@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', '{"sub":"a0000000-0000-4000-8000-000000000003","email":"sneha.kulkarni@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', '{"sub":"a0000000-0000-4000-8000-000000000004","email":"arjun.nair@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', '{"sub":"a0000000-0000-4000-8000-000000000005","email":"priya.sharma@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006', '{"sub":"a0000000-0000-4000-8000-000000000006","email":"vikram.reddy@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000007', '{"sub":"a0000000-0000-4000-8000-000000000007","email":"ananya.iyer@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000008', '{"sub":"a0000000-0000-4000-8000-000000000008","email":"karthik.subramanian@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000009', '{"sub":"a0000000-0000-4000-8000-000000000009","email":"meera.joshi@example.com"}', 'email', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000010', '{"sub":"a0000000-0000-4000-8000-000000000010","email":"dev.patel@example.com"}', 'email', now(), now(), now());

-- Seed profiles (5 students, 5 industry)
INSERT INTO public.profiles (user_id, name, email, user_type, college_name, branch, year_of_study, "current_role", years_of_experience, company, role_category, skills, interests, availability, work_mode, city) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Aisha Verma', 'aisha.verma@example.com', 'student', 'RV College of Engineering', 'Computer Science', '3rd year', NULL, NULL, NULL, 'Developer', ARRAY['React', 'TypeScript', 'Node.js'], ARRAY['hackathons', 'web apps', 'open source'], 'Full-time', 'remote', NULL),
  ('a0000000-0000-4000-8000-000000000002', 'Rahul Menon', 'rahul.menon@example.com', 'student', 'IIT Madras', 'Data Science', '2nd year', NULL, NULL, NULL, 'Data/ML', ARRAY['Python', 'scikit-learn', 'SQL'], ARRAY['machine learning', 'fintech', 'visualization'], 'Part-time <10hrs/week', 'in-person', 'Chennai'),
  ('a0000000-0000-4000-8000-000000000003', 'Sneha Kulkarni', 'sneha.kulkarni@example.com', 'industry', NULL, NULL, NULL, 'Product Designer', 4, 'Flipkart', 'Designer', ARRAY['Figma', 'Prototyping', 'User Research'], ARRAY['edtech', 'design systems', 'accessibility'], 'Weekends only', 'remote', NULL),
  ('a0000000-0000-4000-8000-000000000004', 'Arjun Nair', 'arjun.nair@example.com', 'industry', NULL, NULL, NULL, 'Backend Engineer', 5, 'Zerodha', 'Developer', ARRAY['Go', 'PostgreSQL', 'Kubernetes'], ARRAY['fintech', 'distributed systems', 'infra'], 'Part-time <10hrs/week', 'remote', NULL),
  ('a0000000-0000-4000-8000-000000000005', 'Priya Sharma', 'priya.sharma@example.com', 'student', 'VIT Vellore', 'Electronics & Communication', '4th year', NULL, NULL, NULL, 'Data/ML', ARRAY['Python', 'TensorFlow', 'Pandas'], ARRAY['healthcare AI', 'computer vision'], 'Full-time', 'in-person', 'Chennai'),
  ('a0000000-0000-4000-8000-000000000006', 'Vikram Reddy', 'vikram.reddy@example.com', 'industry', NULL, NULL, NULL, 'Product Manager', 6, 'Swiggy', 'Product', ARRAY['Roadmapping', 'SQL', 'A/B Testing'], ARRAY['consumer apps', 'growth', 'marketplaces'], 'Weekends only', 'in-person', 'Bengaluru'),
  ('a0000000-0000-4000-8000-000000000007', 'Ananya Iyer', 'ananya.iyer@example.com', 'student', 'Anna University', 'Information Technology', '3rd year', NULL, NULL, NULL, 'Designer', ARRAY['Figma', 'Illustrator', 'Motion Design'], ARRAY['UX research', 'social impact', 'branding'], 'Part-time <10hrs/week', 'remote', NULL),
  ('a0000000-0000-4000-8000-000000000008', 'Karthik Subramanian', 'karthik.subramanian@example.com', 'industry', NULL, NULL, NULL, 'Data Scientist', 3, 'Freshworks', 'Data/ML', ARRAY['Python', 'PyTorch', 'Airflow'], ARRAY['NLP', 'SaaS', 'recommendation systems'], 'Full-time', 'remote', NULL),
  ('a0000000-0000-4000-8000-000000000009', 'Meera Joshi', 'meera.joshi@example.com', 'student', 'ICT Mumbai', 'Information Technology', '2nd year', NULL, NULL, NULL, 'Developer', ARRAY['Flutter', 'Firebase', 'Dart'], ARRAY['mobile apps', 'agritech', 'education'], 'Weekends only', 'in-person', 'Mumbai'),
  ('a0000000-0000-4000-8000-000000000010', 'Dev Patel', 'dev.patel@example.com', 'industry', NULL, NULL, NULL, 'DevOps Engineer', 2, 'Infosys', 'Other', ARRAY['AWS', 'Terraform', 'Docker'], ARRAY['cloud', 'automation', 'developer tooling'], 'Part-time <10hrs/week', 'remote', NULL);