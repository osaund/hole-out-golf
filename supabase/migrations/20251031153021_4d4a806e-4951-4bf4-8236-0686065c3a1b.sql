-- Add unique constraint to ensure only one prize claim per user per day
CREATE UNIQUE INDEX unique_prize_claim_per_day 
ON public.prize_claims (user_id, extract_date_immutable(claim_date));