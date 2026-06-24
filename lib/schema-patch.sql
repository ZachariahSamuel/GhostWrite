-- Run this in Supabase SQL Editor to update plan defaults to Pro (BWP 80)
-- All new signups will be assigned Pro plan with unlimited credits

ALTER TABLE public.profiles
  ALTER COLUMN plan SET DEFAULT 'pro';

ALTER TABLE public.profiles
  ALTER COLUMN credits_total SET DEFAULT 999999;

-- Update existing free users to pro (optional — only if you want to grandfather everyone)
-- UPDATE public.profiles SET plan = 'pro', credits_total = 999999 WHERE plan = 'free';

-- Update the trigger function to default to pro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, first_name, last_name,
    country, plan, credits_total
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'country', 'BW'),
    'pro',
    999999
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── PAYMENTS TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider     TEXT NOT NULL CHECK (provider IN ('dpo','paystack')),
  amount       NUMERIC NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'BWP',
  tier         TEXT NOT NULL DEFAULT 'monthly' CHECK (tier IN ('monthly','semester','annual','pro')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','complete','failed','refunded')),
  reference    TEXT UNIQUE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- If the payments table already exists, add the tier column:
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'monthly';

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Add billing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS next_billing TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_user   ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref    ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
