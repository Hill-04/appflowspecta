
-- 1. Marcar etapas como conversão
ALTER TABLE message_steps ADD COLUMN is_conversion boolean NOT NULL DEFAULT false;

-- 2. Referência direta à etapa atual (imune a reordenação)
ALTER TABLE campaign_leads ADD COLUMN current_step_id uuid REFERENCES message_steps(id) ON DELETE SET NULL;

-- 3. Timestamp da primeira conversão
ALTER TABLE campaign_leads ADD COLUMN converted_at timestamptz;

-- 4. Valor individual do negócio por lead
ALTER TABLE campaign_leads ADD COLUMN deal_value numeric(12,2) NOT NULL DEFAULT 0;

-- 5. Investimento por campanha
ALTER TABLE campaigns ADD COLUMN investment numeric(12,2) NOT NULL DEFAULT 0;

-- 6. Trigger de conversão automática baseado em current_step_id
CREATE OR REPLACE FUNCTION public.auto_set_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.current_step_id IS DISTINCT FROM OLD.current_step_id THEN
    IF NEW.converted_at IS NULL AND EXISTS (
      SELECT 1 FROM public.message_steps
      WHERE id = NEW.current_step_id
        AND is_conversion = true
    ) THEN
      NEW.converted_at = now();
      NEW.status = 'interested';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_conversion
BEFORE UPDATE OF current_step_id ON public.campaign_leads
FOR EACH ROW EXECUTE FUNCTION public.auto_set_conversion();

-- 7. Retroativo: preencher current_step_id para leads existentes
UPDATE campaign_leads cl
SET current_step_id = ms.id
FROM message_steps ms
WHERE ms.campaign_id = cl.campaign_id AND ms.step_order = cl.step_index
  AND cl.current_step_id IS NULL;

-- 8. Retroativo: marcar leads já convertidos
UPDATE campaign_leads SET converted_at = now()
WHERE status = 'interested' AND converted_at IS NULL;
