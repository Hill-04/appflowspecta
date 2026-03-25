
-- 1. Tabela: user_calendar_connections
CREATE TABLE IF NOT EXISTS public.user_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'google',
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expiry_date timestamptz NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendar connections"
  ON public.user_calendar_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_user_calendar_connections_updated_at
  BEFORE UPDATE ON public.user_calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela: lead_calendar_events
CREATE TABLE IF NOT EXISTS public.lead_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'task',
  title text NOT NULL,
  description text,
  location text,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled',
  completed_at timestamptz,
  is_overdue boolean NOT NULL DEFAULT false,
  auto_generated boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium',
  source text NOT NULL DEFAULT 'manual',
  google_event_id text,
  sync_status text NOT NULL DEFAULT 'not_connected',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendar events"
  ON public.lead_calendar_events FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Colunas extras em campaign_leads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_leads' AND column_name = 'has_upcoming_event') THEN
    ALTER TABLE public.campaign_leads ADD COLUMN has_upcoming_event boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_leads' AND column_name = 'next_event_datetime') THEN
    ALTER TABLE public.campaign_leads ADD COLUMN next_event_datetime timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaign_leads' AND column_name = 'last_event_datetime') THEN
    ALTER TABLE public.campaign_leads ADD COLUMN last_event_datetime timestamptz;
  END IF;
END $$;

-- 4. Trigger function: refresh lead event flags
CREATE OR REPLACE FUNCTION public.refresh_lead_event_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead_id uuid;
  _campaign_id uuid;
  _next timestamptz;
  _last timestamptz;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _lead_id := OLD.lead_id;
    _campaign_id := OLD.campaign_id;
  ELSE
    _lead_id := NEW.lead_id;
    _campaign_id := NEW.campaign_id;
  END IF;

  SELECT MIN(start_datetime) INTO _next
  FROM public.lead_calendar_events
  WHERE lead_id = _lead_id AND campaign_id = _campaign_id
    AND status = 'scheduled' AND start_datetime > now();

  SELECT MAX(COALESCE(completed_at, start_datetime)) INTO _last
  FROM public.lead_calendar_events
  WHERE lead_id = _lead_id AND campaign_id = _campaign_id
    AND status IN ('completed', 'missed', 'overdue');

  UPDATE public.campaign_leads
  SET has_upcoming_event = (_next IS NOT NULL),
      next_event_datetime = _next,
      last_event_datetime = _last
  WHERE lead_id = _lead_id AND campaign_id = _campaign_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_lead_event_flags ON public.lead_calendar_events;
CREATE TRIGGER trg_refresh_lead_event_flags
  AFTER INSERT OR UPDATE OR DELETE ON public.lead_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_lead_event_flags();

-- 5. Function: mark overdue events
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
  WHERE status = 'scheduled' AND type = 'meeting' AND start_datetime < now();
  GET DIAGNOSTICS affected1 = ROW_COUNT;

  UPDATE public.lead_calendar_events
  SET status = 'overdue', is_overdue = true
  WHERE status = 'scheduled' AND type IN ('followup', 'task') AND start_datetime < now();
  GET DIAGNOSTICS affected2 = ROW_COUNT;

  RETURN affected1 + affected2;
END;
$$;
