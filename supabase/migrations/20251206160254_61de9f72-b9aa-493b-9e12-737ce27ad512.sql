-- Add entry_fee column to events table
ALTER TABLE public.events ADD COLUMN entry_fee numeric DEFAULT 0;