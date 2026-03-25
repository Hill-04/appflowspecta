const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tqcdplapyymjbilraigg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNTk4OSwiZXhwIjoyMDg2MzAxOTg5fQ.GIYq5gE9jIV8Y_FG8k-Kv_NuT1HFB5S0jMPe82rNcr4';
const USER_ID = '4f0cc0bb-d9c2-4812-8c9f-609017b87b10';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seed() {
  console.log('🌱 Iniciando Super Seed para Brayan...');

  // 1. Atualizar Perfil
  console.log('👤 Configurando Perfil Executivo...');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: 'Brayan',
      last_name: 'Guarnieri',
      preferred_name: 'Brayan',
      treatment_type: 'senhor',
      personal_profile_completed: true,
      onboarding_completed: true,
      offer_type: 'SDR as a Service / Automação de Vendas',
      target_audience_description: 'Donos de agências e clínicas que precisam de mais leads qualificados.',
      main_pain: 'Baixa conversão de leads e falta de tempo para prospecção manual.',
      differential: 'Inteligência Artificial ultra-personalizada e automação humanizada.',
      average_ticket: 'R$ 2.000 - R$ 5.000',
      contact_channel: 'WhatsApp/Instagram',
      orion_welcomed: true
    })
    .eq('id', USER_ID);

  if (profileError) console.error('❌ Erro no Perfil:', profileError.message);
  else console.log('✅ Perfil configurado e Onboarding pulado!');

  // 2. Criar Audience
  console.log('👥 Criando Público Alvo...');
  const { data: audience, error: audienceError } = await supabase
    .from('audiences')
    .insert({
      user_id: USER_ID,
      name: 'Dentistas High Ticket',
      description: 'Dentistas em São Paulo focados em Lentes de Contato e implantes.',
      segment: 'Odontologia',
      criteria: ['Faturamento > 50k', 'Presença no Instagram', 'Time comercial pequeno']
    })
    .select()
    .single();

  if (audienceError) console.error('❌ Erro na Audience:', audienceError.message);
  else console.log('✅ Público "Dentistas High Ticket" criado!');

  // 3. Criar Campanha
  console.log('📢 Criando Campanha...');
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      user_id: USER_ID,
      name: 'Campanha Odonto Março',
      audience_id: audience?.id,
      status: 'active',
      prospecting_status: 'in_progress',
      investment: 500
    })
    .select()
    .single();

  if (campaignError) console.error('❌ Erro na Campanha:', campaignError.message);
  else {
    console.log('✅ Campanha "Odonto Março" criada!');

    // 4. Criar Funil (Message Steps)
    console.log('🧬 Criando Funil de Vendas...');
    const steps = [
      { campaign_id: campaign.id, step_name: 'Primeiro Contato', step_order: 1, variation_a: 'Olá {{name}}, vi seu perfil no Instagram...', is_conversion: false },
      { campaign_id: campaign.id, step_name: 'Apresentação', step_order: 2, variation_a: 'Trabalhamos com automação para clínicas...', is_conversion: false },
      { campaign_id: campaign.id, step_name: 'Fechamento', step_order: 3, variation_a: 'Podemos agendar uma call amanhã?', is_conversion: true }
    ];
    const { error: stepsError } = await supabase.from('message_steps').insert(steps);
    if (stepsError) console.error('❌ Erro no Funil:', stepsError.message);
    else console.log('✅ Funil de 3 etapas configurado!');

    // 5. Criar Leads de Exemplo
    console.log('📈 Adicionando Leads Qualificados...');
    const leads = [
      { user_id: USER_ID, name: 'Dr. Carlos Silva', company: 'Odonto Premium', role: 'Dono', phone: '11999999999', email: 'carlos@odonto.com' },
      { user_id: USER_ID, name: 'Dra. Ana Costa', company: 'Sorriso Sorocaba', role: 'Socia', phone: '15988888888', email: 'ana@sorriso.com' }
    ];
    const { data: insertedLeads, error: leadsError } = await supabase.from('leads').insert(leads).select();
    
    if (leadsError) console.error('❌ Erro nos Leads:', leadsError.message);
    else {
      console.log('✅ 2 Leads adicionados!');
      
      // Vincular Leads à Campanha
      const campaignLeads = insertedLeads.map(l => ({
        campaign_id: campaign.id,
        lead_id: l.id,
        status: 'pending',
        step_index: 0
      }));
      await supabase.from('campaign_leads').insert(campaignLeads);
    }
  }

  // 6. Criar Scripts
  console.log('📜 Adicionando Scripts de Abordagem...');
  const scripts = [
    { user_id: USER_ID, name: 'Script Abertura Dentistas', type: 'opening', content: 'Fala {{name}}, notei que vocês estão com uma estrutura top na {{company}}...' },
    { user_id: USER_ID, name: 'Quebra de Objeção: Preço', type: 'objection_response', content: 'Entendo perfeitamente, mas o ROI em clínicas costuma ser de 5x...' }
  ];
  await supabase.from('scripts').insert(scripts);

  console.log('\n🎉 SUPER SEED CONCLUÍDO! O FlowSpecta do Brayan está pronto para uso!');
}

seed();
