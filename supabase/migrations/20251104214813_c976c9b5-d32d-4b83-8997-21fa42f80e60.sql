-- Add played_at timestamp to shots table to track when the play button was pressed
ALTER TABLE public.shots 
ADD COLUMN IF NOT EXISTS played_at TIMESTAMP WITH TIME ZONE DEFAULT now();