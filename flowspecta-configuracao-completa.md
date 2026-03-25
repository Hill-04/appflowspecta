# FLOWSPECTA - CONFIGURAÇÃO COMPLETA
_Sistema de Prospecção com Auto-Aprimoramento | Configurado em 24/03/2026_

---

## ✅ CAMPANHAS (3)
| ID | Nome |
|---|---|
| CMP.01 | Clinicas e Consultorios de Saude (dentistas) |
| CMP.02 | Advogados e Escritórios de Advocacia Solo/Pequenos |
| CMP.03 | Studios de Fitness Premium (Pilates · Funcional · Personal) |

---

## ✅ LEAD TEMPLATES (3)
- `LT - Post Insta (Dentistas)` — Nome, Link do Perfil, Conteúdo do Post
- `LT - Post Insta (Advogados)` — Nome, Link do Perfil, Conteúdo do Post
- `LT - Post Insta (Fitness)` — Nome, Link do Perfil, Conteúdo do Post

---

## ✅ PÚBLICOS / AUDIÊNCIAS (3)
- PB - Clínicas e Consultórios de Saúde (dentistas)
- PB - Advogados e Escritórios de Advocacia Solo/Pequenos
- PB - Studios de Fitness Premium (Pilates · Funcional · Personal)

---

## ✅ SCRIPTS (15 total)
**Dentistas (4):** S1 Conteúdo · S2 Identidade Visual · S3 Story · S4 Especialização  
**Advogados (4):** S1 Jurídico · S2 Especialização · S3 Story · S4 Credibilidade  
**Fitness (4):** S1 Método · S2 Identidade Premium · S3 Story · S4 Studio Premium  
**Geral (3):** Follow-up Sem Resposta · Follow-up Qualificação · Fechamento  

---

## ✅ OBJEÇÕES (11 total)
**Comuns (5):** É caro · Vou pensar · Não tenho tempo · Não sei manutenção · Já tenho Instagram  
**Dentistas (2):** Já tenho site · Pacientes por indicação  
**Advogados (2):** OAB tem restrições · Clientes por indicação  
**Fitness (2):** Instagram já me traz alunos · Sem conteúdo profissional  

---

## ✅ KANBAN (8 etapas por campanha)
`Novo Lead` → `DM Enviada` → `Resposta` → `Qualificando` → `Orçamento` → `Negociação` → `Fechado ✅` → `Perdido ❌`

---

## ⚠️ METAS (precisa criar tabela no Supabase)
Ver arquivo: `create-goals-table.sql`  
Após criar tabela, rodar: `node create-goals.cjs`

**Metas planejadas (10):**

| Fase | Meta | Alvo |
|---|---|---|
| 1 - Validação | DMs Enviadas | 300/mês |
| 1 | Taxa de Resposta | 25% |
| 1 | Orçamentos | 12 |
| 1 | Clientes | 2 |
| 1 | Receita | R$2.000 |
| 2 - Consistência | Clientes Ativos | 3/mês |
| 2 | Contratos Recorrentes | 4 |
| 2 | Reserva Emergência | R$3.000 |
| 2 | Receita Mensal | R$3.750 |
| 3 - Saída | SAÍDA DO EMPREGO | Jul 2026 |

---

## 🚀 SISTEMA PRONTO — PRÓXIMO PASSO
1. Cole `create-goals-table.sql` no SQL Editor → **RUN**
2. Depois: `node create-goals.cjs`
3. Comando para prospectar: `"Claude, prospectar 5 dentistas via #dentista"`
