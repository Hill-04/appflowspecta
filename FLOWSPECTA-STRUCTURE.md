# FlowSpecta - Mapa de Integração

## Edge Functions Disponíveis
- admin-manage-user
- check-pix-status
- check-subscription
- google-calendar-auth
- google-calendar-events
- mp-create-preference
- mp-process-payment
- mp-public-key
- mp-webhook
- orion-campaign-insight
- orion-chat
- script-copilot
- set-initial-password
- track-conversion
- validate-coupon

## Funções Críticas para Prospecção
- script-copilot: valida autenticação e payloads, conversa com o gateway de IA para analisar scripts, gerar blocos de abordagem e refinar variações de copy de prospecção por canal e objetivo.
- orion-campaign-insight: valida que a campanha pertence ao usuário, consolida métricas do funil enviadas no request e usa IA para retornar um diagnóstico JSON com gargalo principal, motivo provável, ação recomendada, score e status.
- orion-chat: autentica o usuário, monta contexto estratégico em tempo real com perfil, campanhas, gargalos e metas no Supabase, e envia esse contexto ao assistente ORION para responder de forma consultiva sobre prospecção.

## Banco de Dados
Tabelas principais: leads, campaigns, subscriptions

## Status
- ✅ Repositório clonado
- ✅ Dependências instaladas
- ✅ .env configurado
- ⏸️ Dev server (não necessário para integração)
