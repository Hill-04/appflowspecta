-- CORRIGIR FUNIL DA CAMPANHA DENTISTAS
-- Cole e rode no Supabase SQL Editor

-- 1. Deleta as etapas antigas (campaign_leads não tem FK direto aqui)
DELETE FROM public.message_steps 
WHERE campaign_id = '906dd6d5-8648-42c0-8c89-2be6df152c76';

-- 3. Cria as 8 etapas novas do Kanban
INSERT INTO public.message_steps (campaign_id, step_name, step_order, variation_a, variation_b, is_conversion) VALUES
('906dd6d5-8648-42c0-8c89-2be6df152c76', '1. Novo Lead',         1, '', '', false),
('906dd6d5-8648-42c0-8c89-2be6df152c76', '2. DM Enviada',        2, '', '', false),
('906dd6d5-8648-42c0-8c89-2be6df152c76', '3. Resposta Recebida', 3, '', '', false),
('906dd6d5-8648-42c0-8c89-2be6df152c76', '4. Qualificando',      4, '', '', false),
('906dd6d5-8648-42c0-8c89-2be6df152c76', '5. Orçamento Enviado', 5, '', '', false),
('906dd6d5-8648-42c0-8c89-2be6df152c76', '6. Negociação',        6, '', '', false),
('906dd6d5-8648-42c0-8c89-2be6df152c76', '7. Fechado ✅',        7, '', '', true),
('906dd6d5-8648-42c0-8c89-2be6df152c76', '8. Perdido ❌',        8, '', '', false);
