-- Add foreign key from event_registrations.user_id to profiles.id
ALTER TABLE public.event_registrations
ADD CONSTRAINT event_registrations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;