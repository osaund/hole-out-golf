-- Create a function to extract date from timestamp (immutable)
CREATE OR REPLACE FUNCTION extract_date_immutable(timestamp with time zone)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT $1::date;
$$;

-- Add unique constraint to ensure only one shot per course per day per user
CREATE UNIQUE INDEX unique_shot_per_course_per_day 
ON public.shots (user_id, course_id, extract_date_immutable(created_at));