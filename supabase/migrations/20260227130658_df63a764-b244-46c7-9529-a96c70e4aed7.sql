
-- Add coupon evolution columns
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applies_to_plans text[] DEFAULT NULL;

-- Add coupon_redeemed to pending_purchases for idempotency
ALTER TABLE public.pending_purchases
  ADD COLUMN IF NOT EXISTS coupon_redeemed boolean NOT NULL DEFAULT false;

-- Replace the validation trigger to handle both types
CREATE OR REPLACE FUNCTION public.validate_coupon_discount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.discount_type = 'percent' THEN
    IF NEW.discount_percent < 1 OR NEW.discount_percent > 100 THEN
      RAISE EXCEPTION 'discount_percent must be between 1 and 100';
    END IF;
  ELSIF NEW.discount_type = 'amount' THEN
    IF NEW.discount_amount <= 0 THEN
      RAISE EXCEPTION 'discount_amount must be greater than 0';
    END IF;
  ELSE
    RAISE EXCEPTION 'discount_type must be percent or amount';
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS validate_coupon_discount_trigger ON public.coupons;
CREATE TRIGGER validate_coupon_discount_trigger
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.validate_coupon_discount();
