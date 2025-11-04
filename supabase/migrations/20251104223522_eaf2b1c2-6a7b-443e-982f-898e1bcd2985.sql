-- Add time_of_hole_in_one column to prize_claims table
ALTER TABLE public.prize_claims 
ADD COLUMN time_of_hole_in_one time DEFAULT NULL;