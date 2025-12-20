-- Remove video_url and hole_number columns from shots table
ALTER TABLE public.shots DROP COLUMN IF EXISTS video_url;
ALTER TABLE public.shots DROP COLUMN IF EXISTS hole_number;