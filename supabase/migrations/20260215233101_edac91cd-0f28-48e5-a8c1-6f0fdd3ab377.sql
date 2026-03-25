
-- Fix: mark_overdue_events function
CREATE OR REPLACE FUNCTION public.mark_overdue_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected1 integer;
  affected2 integer;
BEGIN
  UPDATE public.lead_calendar_events
  SET status = 'missed', is_overdue = true
  WHERE status = 'scheduled'
    AND type = 'meeting'
    AND start_datetime < now();
  GET DIAGNOSTICS affected1 = ROW_COUNT;

  UPDATE public.lead_calendar_events
  SET status = 'overdue', is_overdue = true
  WHERE status = 'scheduled'
    AND type IN ('followup', 'task')
    AND start_datetime < now();
  GET DIAGNOSTICS affected2 = ROW_COUNT;

  RETURN affected1 + affected2;
END;
$$;
