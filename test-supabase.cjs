const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabase() {
  console.log('\n🔍 TESTANDO CONEXÃO SUPABASE\n');
  
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const pubKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('URL:', url ? '✅ Configurada' : '❌ FALTANDO');
  console.log('ANON_KEY:', anonKey ? '✅ Configurada' : '❌ FALTANDO');
  console.log('PUBLISHABLE_KEY:', pubKey ? '✅ Configurada' : '❌ FALTANDO');
  
  const key = anonKey || pubKey;
  
  if (!url || !key) {
    console.error('\n❌ Variáveis de ambiente faltando!\n');
    return;
  }
  
  try {
    const supabase = createClient(url, key);
    console.log('\n✅ Client criado com sucesso\n');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('⚠️  Erro:', error.message);
    } else {
      console.log('✅ Conexão com Supabase OK!');
    }
    
  } catch (err) {
    console.error('❌ Erro ao criar client:', err.message);
  }
}

testSupabase();
