

# Persistir Perfil Estratégico no Banco

## Resumo
Adicionar 3 colunas (`proof_results`, `positioning`, `strategic_notes`) à tabela `profiles`, migrar dados do localStorage silenciosamente, e incluir no contexto do ORION.

## 1. Migração de banco
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS proof_results text,
ADD COLUMN IF NOT EXISTS positioning text,
ADD COLUMN IF NOT EXISTS strategic_notes text;
```
RLS existente já cobre SELECT/UPDATE na própria linha — nenhuma política nova necessária.

## 2. StrategicProfilePage.tsx — Mudanças

**Carregar dados do banco** (useEffect lines 57-78):
- Adicionar `proof_results, positioning, strategic_notes` ao SELECT
- Usar `proof_results` para popular `proofs` (split por `\n`) em vez de array vazio fixo
- Usar `positioning` do banco em vez de gerar string a partir de `main_pain`
- Adicionar estado `strategicNotes` para o novo campo
- Após carregar do banco: se campos vazios, checar localStorage (`flowspecta_profile` key que já é usada na line 98) para migração silenciosa — salvar no banco e limpar localStorage

**Salvar no banco** (handleSave lines 95-101):
- Substituir `localStorage.setItem` por `supabase.from("profiles").update({...})` com `proof_results: form.proofs.join("\n")`, `positioning: form.positioning`, `strategic_notes: strategicNotes`
- Tornar handleSave async

**UI — novo card "Anotações Estratégicas"**:
- Adicionar após o card de Posicionamento, com ícone `FileText`
- Textarea com 4 linhas, placeholder "Informações adicionais sobre seu negócio..."
- Mesmo padrão visual dos outros cards

## 3. orion-chat edge function — Mudanças

**SELECT** (line 55): adicionar `proof_results, positioning, strategic_notes` à query de perfil

**profileSection** (lines 69-77): adicionar 3 linhas ao bloco:
```
- Provas e resultados: [proof_results ou "não informado"]
- Posicionamento: [positioning ou "não informado"]
- Notas estratégicas: [strategic_notes ou "não informado"]
```

## Arquivos
- **Migração SQL**: 1 migration (3 colunas)
- **Editados**: `StrategicProfilePage.tsx`, `orion-chat/index.ts`
- **Nenhum outro arquivo alterado**

