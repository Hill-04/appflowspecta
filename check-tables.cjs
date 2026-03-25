const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tqcdplapyymjbilraigg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNTk4OSwiZXhwIjoyMDg2MzAxOTg5fQ.GIYq5gE9jIV8Y_FG8k-Kv_NuT1HFB5S0jMPe82rNcr4'
);

async function checkTables() {
  console.log('🔍 Verificando estrutura do banco...\n');
  
  const { data, error } = await supabase.rpc('get_tables'); // I'll try a common RPC or use another way if it fails
  
  // Since I don't have direct access to information_schema via regular PostgREST often, 
  // I'll check the most common ones we used and try to list what's reachable.
  const tablesToCheck = ['campaigns', 'scripts', 'objections', 'goals', 'audiences', 'leads', 'campaign_leads', 'message_steps', 'profiles'];
  
  console.log('Tabelas alcançáveis e validadas:');
  for (const t of tablesToCheck) {
    const { head, count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`  - ${t} (${count} registros)`);
    } else {
      console.log(`  - ${t} (Erro ou Não encontrada: ${error.message})`);
    }
  }
}

checkTables();
