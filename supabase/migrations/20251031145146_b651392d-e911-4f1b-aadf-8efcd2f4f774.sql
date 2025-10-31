-- Add image_url and coming_soon columns to courses table
ALTER TABLE public.courses 
ADD COLUMN image_url TEXT,
ADD COLUMN coming_soon BOOLEAN DEFAULT false;

-- Clear existing sample courses
DELETE FROM public.courses;

-- Insert the three specific courses
INSERT INTO public.courses (name, location, par_3_count, coming_soon) VALUES
  ('Salisbury & South Wilts', 'Salisbury, Wiltshire', 4, false),
  ('Bibury Golf Course', 'Bibury, Gloucestershire', 3, false),
  ('Grately Golf Course', 'Grately, Hampshire', 4, true);