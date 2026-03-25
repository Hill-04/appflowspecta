CREATE OR REPLACE FUNCTION public.auto_set_conversion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.current_step_id IS DISTINCT FROM OLD.current_step_id THEN
    -- Moving TO a conversion step
    IF NEW.converted_at IS NULL AND EXISTS (
      SELECT 1 FROM public.message_steps
      WHERE id = NEW.current_step_id
        AND is_conversion = true
    ) THEN
      NEW.converted_at = now();
      NEW.status = 'interested';
    END IF;

    -- Moving AWAY from a conversion step (revert conversion)
    IF OLD.converted_at IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.message_steps
      WHERE id = OLD.current_step_id
        AND is_conversion = true
    ) AND NOT EXISTS (
      SELECT 1 FROM public.message_steps
      WHERE id = NEW.current_step_id
        AND is_conversion = true
    ) THEN
      NEW.converted_at = NULL;
      NEW.status = 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;