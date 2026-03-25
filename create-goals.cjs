const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://tqcdplapyymjbilraigg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNTk4OSwiZXhwIjoyMDg2MzAxOTg5fQ.GIYq5gE9jIV8Y_FG8k-Kv_NuT1HFB5S0jMPe82rNcr4'
);
const USER_ID = '4f0cc0bb-d9c2-4812-8c9f-609017b87b10';

const GOALS = [
  // FASE 1: VALIDAÇÃO
  { name: 'FASE 1 - DMs Enviadas', description: '300 DMs (15/dia x 20 dias uteis)', target_value: 300, current_value: 0, metric_type: 'count', period: 'monthly', status: 'active' },
  { name: 'FASE 1 - Taxa de Resposta', description: 'Atingir 25% de taxa de resposta', target_value: 25, current_value: 0, metric_type: 'percentage', period: 'monthly', status: 'active' },
  { name: 'FASE 1 - Orcamentos Enviados', description: '10-15 orcamentos enviados', target_value: 12, current_value: 0, metric_type: 'count', period: 'monthly', status: 'active' },
  { name: 'FASE 1 - Clientes Fechados', description: 'Fechar 1-2 clientes web design', target_value: 2, current_value: 0, metric_type: 'count', period: 'monthly', status: 'active' },
  { name: 'FASE 1 - Receita', description: 'R$2.000 fora do emprego', target_value: 2000, current_value: 0, metric_type: 'currency', period: 'monthly', status: 'active' },
  // FASE 2: CONSISTÊNCIA
  { name: 'FASE 2 - Clientes Ativos', description: '2-3 sites por mes', target_value: 3, current_value: 0, metric_type: 'count', period: 'monthly', status: 'pending' },
  { name: 'FASE 2 - Contratos Recorrentes', description: '3-5 contratos de manutencao mensal', target_value: 4, current_value: 0, metric_type: 'count', period: 'monthly', status: 'pending' },
  { name: 'FASE 2 - Reserva de Emergencia', description: 'Juntar R$3.000 de reserva', target_value: 3000, current_value: 0, metric_type: 'currency', period: 'cumulative', status: 'pending' },
  { name: 'FASE 2 - Receita Mensal', description: 'R$3.000 - R$4.500/mes consistente', target_value: 3750, current_value: 0, metric_type: 'currency', period: 'monthly', status: 'pending' },
  // FASE 3: SAIDA
  { name: 'FASE 3 - SAIDA DO EMPREGO', description: '2 clientes/mes por 2 meses + R$3k reserva', target_value: 3000, current_value: 0, metric_type: 'currency', period: 'cumulative', status: 'pending' },
];

async function createGoals() {
  console.log('Criando metas...');
  // Check what columns exist by trying a minimal insert first
  const test = await s.from('goals').select('*').limit(1);
  if (test.error) { console.error('Tabela goals indisponivel:', test.error.message); return; }

  let ok = 0;
  for (const g of GOALS) {
    const { error } = await s.from('goals').insert({ user_id: USER_ID, ...g });
    if (error) {
      // Try minimal payload
      const { error: e2 } = await s.from('goals').insert({ user_id: USER_ID, name: g.name, description: g.description, target_value: g.target_value, current_value: 0 });
      if (e2) console.error('ERR', g.name, e2.message);
      else ok++;
    } else ok++;
  }
  console.log(ok + '/' + GOALS.length + ' metas criadas!');
}
createGoals();
