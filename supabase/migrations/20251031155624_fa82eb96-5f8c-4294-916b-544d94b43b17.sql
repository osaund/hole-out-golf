-- Remove hole_number column from prize_claims
ALTER TABLE public.prize_claims
DROP COLUMN IF EXISTS hole_number;