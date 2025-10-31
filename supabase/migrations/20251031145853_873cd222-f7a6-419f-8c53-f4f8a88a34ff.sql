-- Add prize_amount column to courses table
ALTER TABLE public.courses 
ADD COLUMN prize_amount DECIMAL(10,2);

-- Update prize amounts for each course
UPDATE public.courses 
SET prize_amount = 1000.00
WHERE name = 'Salisbury & South Wilts';

UPDATE public.courses 
SET prize_amount = 500.00
WHERE name = 'Bibury Course';

UPDATE public.courses 
SET prize_amount = 0.00
WHERE name = 'Grately Golf Course';