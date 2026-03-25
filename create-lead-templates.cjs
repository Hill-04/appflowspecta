const { createClient } = require('@supabase/supabase-js');

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

// Fields matching the app's expected format (LeadModelField in useStore.tsx)
const templateFields = [
  {
    id: 'field-nome',
    label: 'Nome',
    type: 'short_text',
    required: true,
    used_in_script: false,
    is_primary: true,
    action_role: 'profile'
  },
  {
    id: 'field-link',
    label: 'Link do Perfil',
    type: 'link',
    required: true,
    used_in_script: false,
    is_primary: false,
    action_role: 'profile'
  },
  {
    id: 'field-post',
    label: 'Conteudo do Post',
    type: 'long_text',
    required: true,
    used_in_script: true,
    is_primary: false,
    action_role: 'qualification'
  }
];

async function createTemplates() {
  console.log('🎯 Criando Lead Templates...\n');

  const templateDefs = [
    { name: 'LT - Post Insta (Dentistas)', campaign: CAMPAIGNS.dentistas },
    { name: 'LT - Post Insta (Advogados)', campaign: CAMPAIGNS.advogados },
    { name: 'LT - Post Insta (Fitness)', campaign: CAMPAIGNS.fitness }
  ];

  const results = [];

  for (const def of templateDefs) {
    const { data, error } = await supabase
      .from('lead_templates')
      .insert({ user_id: USER_ID, name: def.name, fields: templateFields })
      .select()
      .single();

    if (error) {
      console.log(`❌ Erro ao criar "${def.name}": ${error.message}`);
    } else {
      console.log(`✅ Template criado: ${def.name}`);
      console.log(`   ID: ${data.id}`);
      results.push({ templateId: data.id, campaignId: def.campaign, name: def.name });
    }
  }

  console.log('\n🔗 Vinculando templates às campanhas...\n');

  for (const r of results) {
    const { error } = await supabase
      .from('campaigns')
      .update({ default_lead_template_id: r.templateId })
      .eq('id', r.campaignId);

    if (error) {
      console.log(`❌ Erro ao vincular "${r.name}": ${error.message}`);
    } else {
      console.log(`✅ Template "${r.name}" vinculado à campanha ${r.campaignId}`);
    }
  }

  console.log('\n🎉 Tudo pronto! Recarregue o FlowSpecta para ver os templates.');
}

createTemplates();
