-- Drop event_id column from prize_claims table
ALTER TABLE public.prize_claims DROP COLUMN IF EXISTS event_id;

-- Drop event_registrations table (has foreign key to events)
DROP TABLE IF EXISTS public.event_registrations;

-- Drop events table
DROP TABLE IF EXISTS public.events;