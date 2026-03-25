const { createClient } = require('@supabase/supabase-js');

// ═══════════════════════════════════════════════════════════════
// FLOWSPECTA - CONFIGURAÇÃO COMPLETA
// Scripts, Objeções e Metas BASEADOS NOS PLAYBOOKS REAIS
// ═══════════════════════════════════════════════════════════════

const supabase = createClient(
  'https://tqcdplapyymjbilraigg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNTk4OSwiZXhwIjoyMDg2MzAxOTg5fQ.GIYq5gE9jIV8Y_FG8k-Kv_NuT1HFB5S0jMPe82rNcr4'
);

const USER_ID = '4f0cc0bb-d9c2-4812-8c9f-609017b87b10';

const CAMPAIGNS = {
  dentistas: '906dd6d5-8648-42c0-8c89-2be6df152c76',
  advogados: '937ed0b8-e6bc-4568-913c-5a8ef1740eef',
  fitness: 'da5f84a0-c11c-46c2-9f8a-fd30593d88bc'
};

// ═══════════════════════════════════════════════════════════════
// 1. RENOMEAR CAMPANHAS
// ═══════════════════════════════════════════════════════════════

async function fixCampaigns() {
  console.log('\n🔧 ETAPA 1: Renomeando campanhas...\n');
  
  const updates = [
    {
      id: CAMPAIGNS.dentistas,
      name: 'CMP. 01 - [Clínicas e Consultórios de Saúde (dentistas)]',
      description: 'PB - [Clínicas e Consultórios de Saúde (dentistas)]'
    },
    {
      id: CAMPAIGNS.advogados,
      name: 'CMP. 02 - [Advogados e Escritórios de Advocacia Solo/Pequenos]',
      description: 'PB - [Advogados e Escritórios de Advocacia Solo/Pequenos]'
    },
    {
      id: CAMPAIGNS.fitness,
      name: 'CMP. 03 - [Studios de Fitness Premium (Pilates · Funcional · Personal)]',
      description: 'PB - [Studios de Fitness Premium (Pilates · Funcional · Personal)]'
    }
  ];
  
  for (const campaign of updates) {
    const { error } = await supabase
      .from('campaigns')
      .update({
        name: campaign.name,
        description: campaign.description,
        status: 'active'
      })
      .eq('id', campaign.id);
    
    if (error) {
      console.log(`❌ ${campaign.name.substring(0, 30)}...`, error.message);
    } else {
      console.log(`✅ ${campaign.name}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. CRIAR SCRIPTS (EXATOS DOS PLAYBOOKS)
// ═══════════════════════════════════════════════════════════════

async function createScripts() {
  console.log('\n📝 ETAPA 2: Criando scripts de abordagem (dos playbooks)...\n');
  
  const scripts = [
    // ═══ DENTISTAS ═══
    // (Mantidos os scripts anteriores que funcionam bem)
    
    // ═══ ADVOGADOS (DO PLAYBOOK REAL) ═══
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      name: 'S1 - Conteúdo Jurídico (Advogados)',
      content: 'Dr./Dra. {nome}, vi seu post sobre {conteudo_post} — explicação direta, sem juridiquês desnecessário.\n\nEsse é o tipo de conteúdo que gera confiança antes mesmo do primeiro contato com o cliente.\n\nSou o Brayan, trabalho com sites para advogados.\n\nPosso te fazer uma pergunta sobre sua presença online?',
      type: 'first_contact',
      trigger: 'perfil com posts educativos, explicações de direitos',
      order: 1
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      name: 'S2 - Especialização (Advogados)',
      content: 'Dr./Dra. {nome}, o seu conteúdo sobre {area_atuacao} é muito bem posicionado — dá pra sentir a especialização em cada post.\n\nSou o Brayan, faço sites institucionais para advogados.\n\nQuando um cliente novo pesquisa seu nome antes de te ligar, o que ele encontra além do Instagram?',
      type: 'first_contact',
      trigger: 'bio com área de atuação muito clara e específica',
      order: 2
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      name: 'S3 - Via Story (Advogados)',
      content: '[Reaja ao story com 💡 ou 👏 primeiro]\n\nEsse ponto sobre {tema_juridico_story} é muito relevante — pouca gente explica isso com essa clareza.\n\nSou o Brayan, trabalho com web design pra escritórios.\n\nPosso te fazer uma pergunta rápida?',
      type: 'story',
      trigger: 'story recente - comentário de caso, dica jurídica, bastidor',
      order: 3
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      name: 'S4 - Credibilidade (Advogados)',
      content: 'Dr./Dra. {nome}, passei pelo seu perfil — o nível do conteúdo sobre {area} é muito acima da média.\n\nSou o Brayan, faço sites para advogados que querem que essa autoridade apareça fora do Instagram também.\n\nQuando um potencial cliente te pesquisa online, o que ele encontra além daqui?',
      type: 'first_contact',
      trigger: 'perfil com muito conteúdo de qualidade mas presença digital fraca',
      order: 4
    },
    
    // ═══ FITNESS (DO PLAYBOOK REAL) ═══
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      name: 'S1 - Conteúdo/Método (Fitness)',
      content: '{nome}, vi o post do {studio} sobre {treino_metodo_resultado} — dá pra sentir a diferença do trabalho de vocês só pelo conteúdo.\n\nSou o Brayan, trabalho com web design pra studios premium.\n\nTenho uma curiosidade: quando alguém descobre o studio pelo Instagram e quer saber mais — modalidades, horários, preços — pra onde você manda essa pessoa hoje?',
      type: 'first_contact',
      trigger: 'posts sobre metodologia, resultados de alunos, bastidores do treino',
      order: 1
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      name: 'S2 - Identidade Visual (Fitness)',
      content: '{nome}, o {studio} tem uma identidade visual muito bem construída — não é todo studio que consegue transmitir o nível do trabalho só pelo feed.\n\nSou o Brayan, faço sites pra studios de fitness premium.\n\nPosso te fazer uma pergunta sobre como vocês estão convertendo esse interesse em novos alunos?',
      type: 'first_contact',
      trigger: 'feed com identidade visual muito cuidada e espaço bem fotografado',
      order: 2
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      name: 'S3 - Via Story (Fitness)',
      content: '[Reaja ao story com ✨ ou 💪 primeiro]\n\nEsse {exercicio_resultado_bastidor} que você postou é exatamente o tipo de conteúdo que gera confiança antes mesmo do aluno aparecer pela primeira vez.\n\nSou o Brayan, trabalho com web design pra studios.\n\nPosso te fazer uma pergunta rápida?',
      type: 'story',
      trigger: 'story recente de treino, resultado de aluno ou bastidor do studio',
      order: 3
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      name: 'S4 - Premium (Fitness)',
      content: '{nome}, passei pelo perfil do {studio} — dá pra ver que o nível é diferente das academias comuns.\n\nSou o Brayan, faço sites pra studios premium que querem transmitir esse diferencial desde o primeiro contato online.\n\nVocê tem algum lugar além do Instagram onde novos alunos conseguem conhecer o studio antes de aparecer?',
      type: 'first_contact',
      trigger: 'studio de alto ticket — equipamentos, ambiente, preços premium',
      order: 4
    }
  ];
  
  let created = 0;
  for (const script of scripts) {
    const { error } = await supabase
      .from('scripts')
      .insert(script);
    
    if (error) {
      console.log(`❌ ${script.name}:`, error.message);
    } else {
      console.log(`✅ ${script.name}`);
      created++;
    }
  }
  
  console.log(`\n📊 Total: ${created}/8 scripts criados`);
}

// ═══════════════════════════════════════════════════════════════
// 3. CRIAR OBJEÇÕES (EXATAS DOS PLAYBOOKS)
// ═══════════════════════════════════════════════════════════════

async function createObjections() {
  console.log('\n🎲 ETAPA 3: Cadastrando objeções (dos playbooks)...\n');
  
  const objections = [
    // ═══ ADVOGADOS (DO PLAYBOOK) ═══
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      objection: 'Meus clientes vêm por indicação',
      response: 'Indicação é ouro. Mas quando o indicado vai te pesquisar antes de ligar — o que ele encontra? Um site profissional valida a indicação e remove a dúvida antes do contato.',
      category: 'advogados'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      objection: 'A OAB tem restrições',
      response: 'Com certeza — por isso o foco é credibilidade, não propaganda. Área de atuação, formação, contato. Nada de prometer resultados. Dentro das normas.',
      category: 'advogados'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      objection: 'Não preciso de mais clientes',
      response: 'Faz sentido. Mas um site também filtra — você atrai o perfil certo e reduz reuniões improdutivas com casos fora da sua área.',
      category: 'advogados'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      objection: 'É caro',
      response: 'Um único cliente de valor já cobre o investimento. Qual seria o honorário de um caso ideal pra você?',
      category: 'advogados'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      objection: 'Não tenho tempo',
      response: 'Você me passa as informações numa conversa de 30 minutos. Cuido de tudo e entrego em 7 dias.',
      category: 'advogados'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.advogados,
      objection: 'Vou pensar',
      response: 'Claro, sem pressão. Só te pergunto: qual seria o principal ponto que te faria avançar ou não com isso?',
      category: 'advogados'
    },
    
    // ═══ FITNESS (DO PLAYBOOK) ═══
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      objection: 'O Instagram já me traz alunos',
      response: 'Ótimo — o site não substitui o Instagram, ele potencializa. Você usa o Insta pra atrair e o site pra converter. O aluno vê o conteúdo, vai pro site, já agenda a aula experimental.',
      category: 'fitness'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      objection: 'As pessoas vêm por indicação',
      response: 'Indicação é o melhor canal. Mas quando o indicado pesquisa o studio antes de aparecer — o que ele encontra que justifica o investimento?',
      category: 'fitness'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      objection: 'É caro',
      response: 'Se você fechar 2 novos alunos mensais por causa do site, ele já se paga em 1–2 meses. Quanto é sua mensalidade média?',
      category: 'fitness'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      objection: 'Não tenho conteúdo pra preencher',
      response: 'Parte do trabalho é te ajudar a estruturar isso. Geralmente 5 informações bem posicionadas convertem mais do que um site cheio.',
      category: 'fitness'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      objection: 'Não tenho tempo',
      response: 'Você me passa as informações e cuido de tudo. Em 7 dias o site está no ar com suas cores, fotos e modalidades.',
      category: 'fitness'
    },
    {
      user_id: USER_ID,
      campaign_id: CAMPAIGNS.fitness,
      objection: 'Vou pensar',
      response: 'Claro, sem pressão. Só te pergunto: qual seria o principal ponto que te faria avançar ou não com isso?',
      category: 'fitness'
    }
  ];
  
  let created = 0;
  for (const objection of objections) {
    const { error } = await supabase
      .from('objections')
      .insert(objection);
    
    if (error) {
      console.log(`❌ "${objection.objection}":`, error.message);
    } else {
      console.log(`✅ [${objection.category}] "${objection.objection}"`);
      created++;
    }
  }
  
  console.log(`\n📊 Total: ${created}/12 objeções criadas`);
}

// ═══════════════════════════════════════════════════════════════
// 4. CONFIGURAR METAS (DO PLANO DE SAÍDA)
// ═══════════════════════════════════════════════════════════════

async function createGoals() {
  console.log('\n🎯 ETAPA 4: Configurando metas (Plano de Saída)...\n');
  
  const goals = [
    // FASE 1 (Março/Abril 2026)
    {
      user_id: USER_ID,
      name: 'FASE 1 - DMs Enviadas',
      target_value: 300,
      current_value: 0,
      unit: 'DMs',
      deadline: '2026-04-30',
      description: '15 DMs/dia durante 20 dias (meta diária não negociável)',
      phase: 1
    },
    {
      user_id: USER_ID,
      name: 'FASE 1 - Respostas Recebidas',
      target_value: 75,
      current_value: 0,
      unit: 'respostas',
      deadline: '2026-04-30',
      description: 'Taxa de resposta 20-30% (60-90 respostas)',
      phase: 1
    },
    {
      user_id: USER_ID,
      name: 'FASE 1 - Orçamentos Enviados',
      target_value: 12,
      current_value: 0,
      unit: 'orçamentos',
      deadline: '2026-04-30',
      description: '10-15 orçamentos (1 a cada 6-8 conversas)',
      phase: 1
    },
    {
      user_id: USER_ID,
      name: 'FASE 1 - Clientes Fechados',
      target_value: 2,
      current_value: 0,
      unit: 'clientes',
      deadline: '2026-04-30',
      description: '1-2 clientes (meta mínima do mês)',
      phase: 1
    },
    {
      user_id: USER_ID,
      name: 'FASE 1 - Receita',
      target_value: 2000,
      current_value: 0,
      unit: 'R$',
      deadline: '2026-04-30',
      description: 'R$1.300-3.000 (primeiro dinheiro fora do emprego)',
      phase: 1
    },
    
    // FASE 2 (Maio/Junho 2026)
    {
      user_id: USER_ID,
      name: 'FASE 2 - Clientes Ativos/Mês',
      target_value: 3,
      current_value: 0,
      unit: 'clientes',
      deadline: '2026-06-30',
      description: '2-3 sites/mês (R$3.000-4.500/mês)',
      phase: 2
    },
    {
      user_id: USER_ID,
      name: 'FASE 2 - Contratos Manutenção',
      target_value: 4,
      current_value: 0,
      unit: 'contratos',
      deadline: '2026-06-30',
      description: '3-5 clientes recorrentes (R$300-500/mês cada)',
      phase: 2
    },
    {
      user_id: USER_ID,
      name: 'FASE 2 - Cases Documentados',
      target_value: 3,
      current_value: 0,
      unit: 'cases',
      deadline: '2026-06-30',
      description: '3 cases com print/depoimento (prova social)',
      phase: 2
    },
    {
      user_id: USER_ID,
      name: 'FASE 2 - Reserva Emergência',
      target_value: 3000,
      current_value: 0,
      unit: 'R$',
      deadline: '2026-06-30',
      description: 'R$3.000 guardados (critério para sair do emprego)',
      phase: 2
    },
    
    // FASE 3 (Julho 2026+)
    {
      user_id: USER_ID,
      name: 'FASE 3 - SAÍDA DO EMPREGO',
      target_value: 3000,
      current_value: 0,
      unit: 'R$',
      deadline: '2026-07-31',
      description: 'R$3.000+/mês por 2 meses consecutivos',
      phase: 3
    }
  ];
  
  let created = 0;
  for (const goal of goals) {
    const { error } = await supabase
      .from('goals')
      .insert(goal);
    
    if (error) {
      console.log(`❌ ${goal.name}:`, error.message);
    } else {
      console.log(`✅ [FASE ${goal.phase}] ${goal.name}`);
      created++;
    }
  }
  
  console.log(`\n📊 Total: ${created}/10 metas criadas`);
}

// ═══════════════════════════════════════════════════════════════
// EXECUTAR TUDO
// ═══════════════════════════════════════════════════════════════

async function runAll() {
  console.log('🚀 FLOWSPECTA - CONFIGURAÇÃO BASEADA NOS PLAYBOOKS REAIS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    await fixCampaigns();
    await createScripts();
    await createObjections();
    await createGoals();
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ CONFIGURAÇÃO COMPLETA FINALIZADA!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 RESUMO:');
    console.log('  ✅ 3 Campanhas renomeadas');
    console.log('  ✅ 8 Scripts dos playbooks reais');
    console.log('  ✅ 12 Objeções dos playbooks');
    console.log('  ✅ 10 Metas do Plano de Saída');
    console.log('\n🎯 SISTEMA PRONTO PARA AUTO-APRIMORAMENTO!');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
}

runAll();
