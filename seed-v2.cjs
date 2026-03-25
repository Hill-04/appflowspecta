const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tqcdplapyymjbilraigg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNTk4OSwiZXhwIjoyMDg2MzAxOTg5fQ.GIYq5gE9jIV8Y_FG8k-Kv_NuT1HFB5S0jMPe82rNcr4';
const USER_ID = '4f0cc0bb-d9c2-4812-8c9f-609017b87b10';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seed() {
  console.log('🌱 Iniciando Super Seed V2 (UPSERT)...');

  // 1. Upsert Perfil
  console.log('👤 Configurando Perfil Executivo...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: USER_ID,
      email: 'brayanalexguarnieri@gmail.com',
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
    });

  if (profileError) console.error('❌ Erro no Perfil:', profileError.message);
  else console.log('✅ Perfil criado/atualizado!');

  // 2. Criar Audience
  console.log('👥 Criando Público Alvo...');
  const { data: audience, error: audienceError } = await supabase
    .from('audiences')
    .upsert({
      user_id: USER_ID,
      name: 'Dentistas High Ticket',
      description: 'Dentistas em São Paulo focados em Lentes de Contato e implantes.',
      segment: 'Odontologia',
      criteria: ['Faturamento > 50k', 'Presença no Instagram', 'Time comercial pequeno']
    })
    .select()
    .single();

  if (audienceError) console.error('❌ Erro na Audience:', audienceError.message);
  else console.log('✅ Público "Dentistas High Ticket" pronto!');

  // 3. Criar Campanha
  console.log('📢 Criando Campanha...');
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .upsert({
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
    console.log('✅ Campanha pronta!');

    // Limpar funil antigo se houver e criar novo
    await supabase.from('message_steps').delete().eq('campaign_id', campaign.id);
    const steps = [
      { campaign_id: campaign.id, step_name: 'Primeiro Contato', step_order: 1, variation_a: 'Olá {{name}}, vi seu perfil no Instagram...', is_conversion: false },
      { campaign_id: campaign.id, step_name: 'Apresentação', step_order: 2, variation_a: 'Trabalhamos com automação para clínicas...', is_conversion: false },
      { campaign_id: campaign.id, step_name: 'Fechamento', step_order: 3, variation_a: 'Podemos agendar uma call amanhã?', is_conversion: true }
    ];
    await supabase.from('message_steps').insert(steps);
  }

  // 4. Inserir limites de plano para evitar bloqueios
  console.log('💎 Configurando Limites de Plano...');
  await supabase.from('plan_limits').upsert([
    { plan: 'free', max_users: 1, max_active_campaigns: 1, max_audiences: 1, features: {} },
    { plan: 'pro', max_users: 3, max_active_campaigns: 5, max_audiences: 10, features: { ai_insights: true } },
    { plan: 'scale', max_users: -1, max_active_campaigns: -1, max_audiences: -1, features: { ai_insights: true } }
  ]);

  console.log('\n🎉 SEED V2 CONCLUÍDO! O FlowSpecta do Brayan está desbloqueado.');
}

seed();
