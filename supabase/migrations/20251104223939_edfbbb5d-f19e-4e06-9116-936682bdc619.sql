-- Add tee_time column to prize_claims table
ALTER TABLE public.prize_claims 
ADD COLUMN tee_time time DEFAULT NULL;