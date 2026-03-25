
-- Create coupons table
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 10,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint on code (case insensitive)
CREATE UNIQUE INDEX coupons_code_unique ON public.coupons (LOWER(code));

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Only owners can read coupons via client
CREATE POLICY "Owners can manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Add coupon_code to pending_purchases
ALTER TABLE public.pending_purchases ADD COLUMN IF NOT EXISTS coupon_code text;

-- Add payment_method to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_method text;

-- Validation trigger for discount_percent
CREATE OR REPLACE FUNCTION public.validate_coupon_discount()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.discount_percent < 1 OR NEW.discount_percent > 100 THEN
    RAISE EXCEPTION 'discount_percent must be between 1 and 100';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_coupon_discount
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.validate_coupon_discount();
