-- Drop the existing foreign key constraint on prize_claims
ALTER TABLE public.prize_claims DROP CONSTRAINT IF EXISTS prize_claims_user_id_fkey;

-- Add new foreign key constraint referencing public.profiles
ALTER TABLE public.prize_claims 
ADD CONSTRAINT prize_claims_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;