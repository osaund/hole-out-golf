-- Remove shot_id column from prize_claims table
ALTER TABLE public.prize_claims DROP COLUMN IF EXISTS shot_id;