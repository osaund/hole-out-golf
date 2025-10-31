-- Fix search path for the immutable function
CREATE OR REPLACE FUNCTION extract_date_immutable(timestamp with time zone)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT $1::date;
$$;