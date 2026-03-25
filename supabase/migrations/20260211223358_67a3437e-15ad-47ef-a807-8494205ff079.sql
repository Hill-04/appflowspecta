
-- 5) Remover colunas migradas da tabela leads
ALTER TABLE public.leads DROP COLUMN campaign_id;
ALTER TABLE public.leads DROP COLUMN step_index;
ALTER TABLE public.leads DROP COLUMN status;
ALTER TABLE public.leads DROP COLUMN last_interaction;
