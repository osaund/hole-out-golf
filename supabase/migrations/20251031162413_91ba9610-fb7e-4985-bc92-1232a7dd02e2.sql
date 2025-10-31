-- Enable realtime for shots table
ALTER TABLE public.shots REPLICA IDENTITY FULL;

-- Add shots table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.shots;