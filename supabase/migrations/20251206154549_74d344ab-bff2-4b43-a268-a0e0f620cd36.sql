-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round TEXT NOT NULL,
  region TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  nearest_pin_prize NUMERIC DEFAULT 0,
  organizer TEXT NOT NULL DEFAULT 'Real Golf Tour',
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events
CREATE POLICY "Anyone can view events"
ON public.events
FOR SELECT
USING (true);

-- Admins can manage events
CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations"
ON public.event_registrations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert their own registrations"
ON public.event_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.event_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update registrations (to mark attendance)
CREATE POLICY "Admins can update registrations"
ON public.event_registrations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the existing events
INSERT INTO public.events (round, region, date, venue, nearest_pin_prize, organizer, enabled) VALUES
  ('Round 1', 'Hampshire', '2026-04-04', 'Boundary Lakes GC', 60, 'Real Golf Tour', true),
  ('Round 2', 'Somerset', '2026-06-13', 'Orchardleigh GC', 55, 'Real Golf Tour', false),
  ('Round 3', 'Surrey', '2026-07-06', 'Camberley Heath GC', 133, 'Real Golf Tour', false),
  ('Round 4', 'Wiltshire', '2026-08-31', 'Cumberwell Park GC', 70, 'Real Golf Tour', false),
  ('Round 5', 'Dorset', '2026-10-24', 'Dorset Golf & Country Club', 70, 'Real Golf Tour', false);