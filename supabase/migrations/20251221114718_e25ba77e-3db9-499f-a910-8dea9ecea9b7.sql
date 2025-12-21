-- Update the handle_new_user function to remove full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
BEGIN
  -- Try to get full_name first (for parsing)
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'name', 
    ''
  );
  
  -- Try to get first_name from metadata, or extract from full_name
  v_first_name := COALESCE(
    NULLIF(new.raw_user_meta_data->>'first_name', ''),
    NULLIF(new.raw_user_meta_data->>'given_name', ''),
    NULLIF(split_part(v_full_name, ' ', 1), '')
  );
  
  -- Try to get last_name from metadata, or extract from full_name
  v_last_name := COALESCE(
    NULLIF(new.raw_user_meta_data->>'last_name', ''),
    NULLIF(new.raw_user_meta_data->>'family_name', ''),
    CASE 
      WHEN position(' ' in v_full_name) > 0 
      THEN substring(v_full_name from position(' ' in v_full_name) + 1)
      ELSE ''
    END
  );

  INSERT INTO public.profiles (id, first_name, last_name, email, phone_number)
  VALUES (
    new.id,
    COALESCE(v_first_name, ''),
    COALESCE(v_last_name, ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone_number', new.phone, '')
  );
  RETURN new;
END;
$$;

-- Drop the full_name column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;