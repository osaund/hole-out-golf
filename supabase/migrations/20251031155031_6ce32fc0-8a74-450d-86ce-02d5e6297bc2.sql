-- Add foreign key relationship from prize_claims to profiles
ALTER TABLE public.prize_claims
DROP CONSTRAINT IF EXISTS prize_claims_user_id_fkey;

ALTER TABLE public.prize_claims
ADD CONSTRAINT prize_claims_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;