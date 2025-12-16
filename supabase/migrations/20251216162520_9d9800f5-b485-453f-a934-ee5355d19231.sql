-- Create table to track single play purchases
CREATE TABLE public.single_play_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  course_id UUID REFERENCES public.courses(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.single_play_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own single play credits"
ON public.single_play_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert credits (from edge function)
CREATE POLICY "Service role can insert credits"
ON public.single_play_credits
FOR INSERT
WITH CHECK (true);

-- Users can update their own credits (to mark as used)
CREATE POLICY "Users can update their own credits"
ON public.single_play_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_single_play_credits_user_id ON public.single_play_credits(user_id);
CREATE INDEX idx_single_play_credits_stripe_session ON public.single_play_credits(stripe_session_id);