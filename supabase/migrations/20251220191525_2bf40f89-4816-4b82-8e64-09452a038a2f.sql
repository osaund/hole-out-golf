-- Remove event_id column from shots table
ALTER TABLE public.shots DROP COLUMN IF EXISTS event_id;