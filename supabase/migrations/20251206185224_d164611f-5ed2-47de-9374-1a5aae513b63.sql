-- Add priority column to courses table
ALTER TABLE public.courses ADD COLUMN priority integer DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX idx_courses_priority ON public.courses(priority DESC);