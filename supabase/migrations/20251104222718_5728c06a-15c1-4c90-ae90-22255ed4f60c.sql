-- Add policy to allow admins to view all shots
CREATE POLICY "Admins can view all shots" 
ON public.shots 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));