-- Add foreign key constraints to prize_claims table
-- This will enable proper joins with profiles and shots tables

ALTER TABLE public.prize_claims 
DROP CONSTRAINT IF EXISTS prize_claims_user_id_fkey;

ALTER TABLE public.prize_claims 
ADD CONSTRAINT prize_claims_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.prize_claims 
DROP CONSTRAINT IF EXISTS prize_claims_shot_id_fkey;

ALTER TABLE public.prize_claims 
ADD CONSTRAINT prize_claims_shot_id_fkey 
FOREIGN KEY (shot_id) 
REFERENCES public.shots(id) 
ON DELETE SET NULL;

ALTER TABLE public.prize_claims 
DROP CONSTRAINT IF EXISTS prize_claims_course_id_fkey;

ALTER TABLE public.prize_claims 
ADD CONSTRAINT prize_claims_course_id_fkey 
FOREIGN KEY (course_id) 
REFERENCES public.courses(id) 
ON DELETE CASCADE;