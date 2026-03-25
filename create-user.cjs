const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createUser() {
  console.log('\n🔐 CRIANDO USUÁRIO NO SUPABASE\n');
  
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const supabase = createClient(url, key);
  
  // Criar usuário
  const { data, error } = await supabase.auth.signUp({
    email: 'brayanalexguarnieri@gmail.com',
    password: 'Brayan@Flow2026',
    options: {
      data: {
        full_name: 'Brayan Guarnieri',
      }
    }
  });
  
  if (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    return;
  }
  
  console.log('✅ Usuário criado com sucesso!');
  console.log('📧 Email:', data.user?.email);
  console.log('🆔 User ID:', data.user?.id);
  console.log('\n⚠️  Verifique seu email para confirmar a conta (caso Email Confirmations esteja ativado no painel do Supabase)!\n');
}

createUser();
