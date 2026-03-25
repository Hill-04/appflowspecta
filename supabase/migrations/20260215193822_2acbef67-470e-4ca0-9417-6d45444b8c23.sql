
-- Table for pending purchases (email captured at checkout before payment)
CREATE TABLE public.pending_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  plan text NOT NULL,
  billing_period text NOT NULL DEFAULT 'monthly',
  mp_preference_id text,
  mp_payment_id text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: webhook edge function uses service role, no user-level access needed
ALTER TABLE public.pending_purchases ENABLE ROW LEVEL SECURITY;

-- Add Mercado Pago columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS mp_payer_email text,
  ADD COLUMN IF NOT EXISTS billing_period text DEFAULT 'monthly';

-- Trigger for updated_at on pending_purchases
CREATE TRIGGER update_pending_purchases_updated_at
  BEFORE UPDATE ON public.pending_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
