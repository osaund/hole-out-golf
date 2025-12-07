-- Add event_id column to prize_claims
ALTER TABLE public.prize_claims 
ADD COLUMN event_id uuid REFERENCES public.events(id);

-- Make course_id nullable since claims can now be for events
ALTER TABLE public.prize_claims 
ALTER COLUMN course_id DROP NOT NULL;

-- Add a check constraint to ensure either course_id or event_id is provided
ALTER TABLE public.prize_claims 
ADD CONSTRAINT prize_claims_course_or_event_check 
CHECK (course_id IS NOT NULL OR event_id IS NOT NULL);

-- Create index for event_id
CREATE INDEX idx_prize_claims_event_id ON public.prize_claims(event_id);