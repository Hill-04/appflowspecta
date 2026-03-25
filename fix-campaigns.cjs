const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tqcdplapyymjbilraigg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNTk4OSwiZXhwIjoyMDg2MzAxOTg5fQ.GIYq5gE9jIV8Y_FG8k-Kv_NuT1HFB5S0jMPe82rNcr4'
);

const USER_ID = '4f0cc0bb-d9c2-4812-8c9f-609017b87b10';

const CAMPAIGNS = {
  dentistas: { id: '906dd6d5-8648-42c0-8c89-2be6df152c76', newName: 'CMP. 01 - [Clínicas e Consultórios de Saúde (dentistas)]' },
  advogados: { id: '937ed0b8-e6bc-4568-913c-5a8ef1740eef', newName: 'CMP. 02 - [Advogados e Escritórios de Advocacia Solo/Pequenos]' },
  fitness:   { id: 'da5f84a0-c11c-46c2-9f8a-fd30593d88bc', newName: 'CMP. 03 - [Studios de Fitness Premium (Pilates · Funcional · Personal)]' }
};

// ─── Audiences ──────────────────────────────────────────────────────────────
const AUDIENCES = [
  {
    name: 'PB - Clínicas e Consultórios de Saúde (dentistas)',
    description: 'Dentistas e clínicas odontológicas que investem em marketing digital e estética dental.',
    segment: 'Odontologia',
    criteria: ['Presença ativa no Instagram', 'Posts de antes/depois', 'Especialidade: lentes, implantes, estética', 'Localização: Grande SP / Capitais']
  },
  {
    name: 'PB - Advogados e Escritórios de Advocacia Solo/Pequenos',
    description: 'Advogados solo ou escritórios pequenos que precisam captar clientes e fortalecer autoridade.',
    segment: 'Jurídico',
    criteria: ['Perfil pessoal com conteúdo jurídico', 'OAB ativa', 'Área: trabalhista, família, cível', 'Menos de 5 sócios']
  },
  {
    name: 'PB - Studios de Fitness Premium (Pilates · Funcional · Personal)',
    description: 'Studios e profissionais de fitness premium que buscam alunos de alto ticket.',
    segment: 'Fitness & Saúde',
    criteria: ['Studio próprio ou espaço de treinos', 'Posts de alunos/resultados', 'Preço médio > R$200/mês', 'Localização: bairros nobres']
  }
];

// ─── Scripts ─────────────────────────────────────────────────────────────────
const SCRIPTS = [
  // DENTISTAS
  { name: '[Dentistas] S1 - Conteúdo como Gancho', type: 'opening', tags: ['dentistas', 'abertura'],
    content: 'Oi, {{nome}}! Vi o seu post sobre {{conteudo_post}} e achei incrível. Sigo bastante esse tipo de conteúdo porque trabalho ajudando clínicas e consultórios a atrair mais pacientes pelo Instagram. Você já pensou em escalar esse tipo de publicação estrategicamente?' },
  { name: '[Dentistas] S2 - Identidade Visual', type: 'opening', tags: ['dentistas', 'abertura'],
    content: 'Oi, {{nome}}! Seu feed tem uma identidade visual muito profissional. Trabalho com estratégia de captação para dentistas e percebi que você tem potencial pra atrair muito mais pacientes nas especialidades que você oferece. Posso te mostrar como?' },
  { name: '[Dentistas] S3 - Via Story', type: 'opening', tags: ['dentistas', 'abertura'],
    content: 'Oi, {{nome}}! Vi seu story sobre {{conteudo_post}} — muito bom! Trabalho com captação de pacientes para dentistas pelo Instagram e geralmente profissionais com conteúdo como o seu conseguem gerar resultados rápidos. Você está aberta a uma conversa rápida?' },
  { name: '[Dentistas] S4 - Especialização', type: 'opening', tags: ['dentistas', 'abertura'],
    content: 'Oi, {{nome}}! Vi que você é especialista em {{conteudo_post}}. Essa especialização é exatamente o tipo que gera mais conversão no digital. Ajudo clínicas a transformar essa autoridade em pacientes agendados. Quer entender como funciona?' },
  // ADVOGADOS
  { name: '[Advogados] S1 - Conteúdo Jurídico', type: 'opening', tags: ['advogados', 'abertura'],
    content: 'Olá, Dr(a). {{nome}}! Li seu post sobre {{conteudo_post}} e achei muito didático. Trabalho ajudando advogados a transformar autoridade no Instagram em captação real de clientes. Você já pensou em estratégia de captação digital?' },
  { name: '[Advogados] S2 - Especialização', type: 'opening', tags: ['advogados', 'abertura'],
    content: 'Olá, Dr(a). {{nome}}! Sua especialidade em {{conteudo_post}} é muito valorizada. Ajudo escritórios a posicionarem essa expertise e transformá-la em clientes qualificados. Posso te mostrar como funciona em 5 minutos?' },
  { name: '[Advogados] S3 - Via Story', type: 'opening', tags: ['advogados', 'abertura'],
    content: 'Olá, Dr(a). {{nome}}! Vi seu story e fiquei impressionado com o seu conteúdo jurídico. Trabalho com captação para advogados e percebo que você tem todos os elementos para atrair clientes premium. Posso te contar mais?' },
  { name: '[Advogados] S4 - Credibilidade', type: 'opening', tags: ['advogados', 'abertura'],
    content: 'Olá, Dr(a). {{nome}}! O seu perfil transmite muita credibilidade e autoridade. Esse é o ativo mais valioso para captar clientes de alto valor. Ajudo advogados a monetizar isso. Você tem 5 minutos para entender como?' },
  // FITNESS
  { name: '[Fitness] S1 - Conteúdo/Método', type: 'opening', tags: ['fitness', 'abertura'],
    content: 'Oi, {{nome}}! Vi seu post sobre {{conteudo_post}} e adorei a abordagem. Trabalho ajudando studios de fitness a atrair alunos premium pelo Instagram. Studios com o nível de conteúdo que você produz costumam ter resultados muito rápidos. Posso te explicar como?' },
  { name: '[Fitness] S2 - Identidade Visual', type: 'opening', tags: ['fitness', 'abertura'],
    content: 'Oi, {{nome}}! Seu estúdio tem uma identidade visual incrível. Trabalho com captação de alunos para studios de Pilates, Funcional e Personal Training. Você gostaria de ver como transformar seguidores em alunos pagantes?' },
  { name: '[Fitness] S3 - Via Story', type: 'opening', tags: ['fitness', 'abertura'],
    content: 'Oi, {{nome}}! Vi seu story de aula e fiquei impressionado com a qualidade. Ajudo studios premium a atrair alunos pelo Instagram de forma previsível. Você tem abertura para uma conversa rápida?' },
  { name: '[Fitness] S4 - Premium', type: 'opening', tags: ['fitness', 'abertura'],
    content: 'Oi, {{nome}}! Seu studio tem um posicionamento premium muito claro. Isso é exatamente o perfil de negócio que mais se beneficia de estratégia digital de captação. Posso te mostrar como studios similares estão fechando 5-10 alunos por mês?' },
  // Follow-up
  { name: '[Geral] Follow-up 1 - Sem Resposta', type: 'follow_up', tags: ['follow-up', 'geral'],
    content: 'Oi, {{nome}}! Só passando para ver se você teve chance de ver minha mensagem. Sei que a rotina é corrida. Fica à vontade para me chamar quando fizer sentido!' },
  { name: '[Geral] Follow-up 2 - Qualificação', type: 'follow_up', tags: ['follow-up', 'qualificacao'],
    content: 'Oi, {{nome}}! Para eu entender se faz sentido para o seu caso, me conta: você está buscando novos clientes/pacientes/alunos ativamente hoje?' },
  { name: '[Geral] Fechamento', type: 'closing', tags: ['fechamento', 'geral'],
    content: 'Oi, {{nome}}! Para facilitar, posso te mandar um material rápido com os resultados de casos similares ao seu. Qual o melhor horário para uma call de 15 min esta semana?' }
];

// ─── Objections ──────────────────────────────────────────────────────────────
const OBJECTIONS = [
  { title: '"É caro"', response: 'Entendo! O investimento é relativo. Para te deixar mais confortável: qual seria o valor de fechar 1 novo cliente/paciente/aluno? A maioria dos nossos clientes recupera o investimento no primeiro fechamento.', category: 'Preço', frequency: 10 },
  { title: '"Vou pensar"', response: 'Claro! O que exatamente você precisa analisar? Pergunto porque posso te ajudar a clarificar agora e evitar que fique em aberto. Às vezes é uma dúvida simples que resolvo em 2 minutos.', category: 'Objeção de adiamento', frequency: 9 },
  { title: '"Já tenho agência/marketing"', response: 'Que ótimo! E como está a captação hoje? Pergunto porque o que fazemos é diferente: focamos 100% em prospecção ativa no Instagram, não em anúncios. Muitos dos nossos clientes usam as duas coisas em paralelo.', category: 'Concorrência', frequency: 8 },
  { title: '"Não tenho tempo"', response: 'Justamente por isso que faz sentido! O sistema trabalha enquanto você foca no seu trabalho. São 15 minutos por dia no máximo da sua parte. Quer ver como funciona na prática?', category: 'Objeção de tempo', frequency: 7 },
  { title: '"Não funciona para minha área"', response: 'Entendo a dúvida! Temos resultados em [área específica] justamente porque o método é baseado em conteúdo e autoridade, não em abordagem genérica. Posso te mostrar um caso similar ao seu?', category: 'Ceticismo', frequency: 6 },
  { title: '"Já tentei e não funcionou"', response: 'Que experiência você teve antes? Pergunto porque muitas tentativas falham por falta de consistência ou script certo. O que fazemos é diferente: sistemático, testado e com ajustes contínuos.', category: 'Experiência negativa', frequency: 5 },
  { title: '"Prefiro indicação"', response: 'Indicação é ótima! Mas e quando a agenda está vazia e não vem indicação? O que montamos é um canal previsível e constante, que não depende da sorte. As duas coisas funcionam juntas perfeitamente.', category: 'Canal preferido', frequency: 4 },
  { title: '"Eu faço sozinho"', response: 'Que ótimo que você já faz! Mas imagine ter um sistema que escala isso sem tomar seu tempo de atendimento. Posso te mostrar como profissionais como você estão prospectando 15 leads/dia sem esforço manual?', category: 'Independência', frequency: 3 }
];

// ─── Kanban Steps ─────────────────────────────────────────────────────────────
const KANBAN_STEPS = [
  { name: '1. Novo Lead', isConversion: false },
  { name: '2. DM Enviada', isConversion: false },
  { name: '3. Resposta Recebida', isConversion: false },
  { name: '4. Qualificando', isConversion: false },
  { name: '5. Orçamento Enviado', isConversion: false },
  { name: '6. Negociação', isConversion: false },
  { name: '7. Fechado ✅', isConversion: true },
  { name: '8. Perdido ❌', isConversion: false }
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 CONFIGURAÇÃO COMPLETA DO FLOWSPECTA\n');

  // 1. Rename campaigns
  console.log('─── PARTE 1: Renomeando Campanhas ───');
  for (const [key, c] of Object.entries(CAMPAIGNS)) {
    const { error } = await supabase.from('campaigns').update({ name: c.newName }).eq('id', c.id);
    if (error) console.log(`❌ ${key}: ${error.message}`);
    else console.log(`✅ ${c.newName}`);
  }

  // 2. Delete any previous audiences and create fresh ones
  console.log('\n─── PARTE 2: Criando Públicos ───');
  const audienceIds = {};
  for (const a of AUDIENCES) {
    // Remove existing audience with same name to avoid duplication
    await supabase.from('audiences').delete().eq('user_id', USER_ID).eq('name', a.name);
    const { data, error } = await supabase.from('audiences').insert({ user_id: USER_ID, ...a }).select().single();
    if (error) console.log(`❌ ${a.name}: ${error.message}`);
    else {
      console.log(`✅ Público: ${a.name}`);
      if (a.name.includes('dent')) audienceIds.dentistas = data.id;
      if (a.name.includes('dvog')) audienceIds.advogados = data.id;
      if (a.name.includes('Fit')) audienceIds.fitness = data.id;
    }
  }

  // Link audiences to campaigns
  if (audienceIds.dentistas) await supabase.from('campaigns').update({ audience_id: audienceIds.dentistas }).eq('id', CAMPAIGNS.dentistas.id);
  if (audienceIds.advogados) await supabase.from('campaigns').update({ audience_id: audienceIds.advogados }).eq('id', CAMPAIGNS.advogados.id);
  if (audienceIds.fitness)   await supabase.from('campaigns').update({ audience_id: audienceIds.fitness }).eq('id', CAMPAIGNS.fitness.id);
  console.log('✅ Públicos vinculados às campanhas!');

  // 3. Create scripts
  console.log('\n─── PARTE 3: Criando Scripts ───');
  // Clear old scripts first
  await supabase.from('scripts').delete().eq('user_id', USER_ID);
  let scriptCount = 0;
  for (const s of SCRIPTS) {
    const { error } = await supabase.from('scripts').insert({ user_id: USER_ID, ...s }).select().single();
    if (error) console.log(`❌ ${s.name}: ${error.message}`);
    else { scriptCount++; console.log(`✅ Script: ${s.name}`); }
  }

  // 4. Create objections
  console.log('\n─── PARTE 4: Cadastrando Objeções ───');
  await supabase.from('objections').delete().eq('user_id', USER_ID);
  let objCount = 0;
  for (const o of OBJECTIONS) {
    const { error } = await supabase.from('objections').insert({ user_id: USER_ID, ...o }).select().single();
    if (error) console.log(`❌ ${o.title}: ${error.message}`);
    else { objCount++; process.stdout.write('.'); }
  }
  console.log(`\n✅ ${objCount} objeções cadastradas!`);

  // 5. Update campaign funnels with detailed Kanban steps
  console.log('\n─── PARTE 5: Atualizando Funil Kanban ───');
  for (const [key, c] of Object.entries(CAMPAIGNS)) {
    await supabase.from('message_steps').delete().eq('campaign_id', c.id);
    const stepsToInsert = KANBAN_STEPS.map((s, i) => ({
      campaign_id: c.id,
      step_name: s.name,
      step_order: i + 1,
      variation_a: '',
      variation_b: '',
      is_conversion: s.isConversion
    }));
    const { error } = await supabase.from('message_steps').insert(stepsToInsert);
    if (error) console.log(`❌ Funil ${key}: ${error.message}`);
    else console.log(`✅ Funil 8 etapas: ${c.newName}`);
  }

  console.log('\n════════════════════════════════════════');
  console.log('🎉 CONFIGURAÇÃO COMPLETA!');
  console.log(`  ✅ 3 campanhas renomeadas`);
  console.log(`  ✅ 3 públicos criados e vinculados`);
  console.log(`  ✅ ${scriptCount} scripts cadastrados`);
  console.log(`  ✅ ${objCount} objeções cadastradas`);
  console.log(`  ✅ Funil com 8 etapas configurado em todas as campanhas`);
  console.log('════════════════════════════════════════');
  console.log('🔄 Recarregue o FlowSpecta para ver tudo!');
}

main();
