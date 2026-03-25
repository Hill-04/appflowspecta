const { createClient } = require('@supabase/supabase-js');

// Usando as chaves fornecidas pelo usuário
const supabase = createClient(
  'https://tqcdplapyymjbilraigg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjU5ODksImV4cCI6MjA4NjMwMTk4OX0.z9Td45SOSlBpNZZyB4R1Bsn0ax9jujt2Md_3jW3IEX4'
);

// Chave Service Role para diagnóstico (obtida em passos anteriores)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNTk4OSwiZXhwIjoyMDg2MzAxOTg5fQ.GIYq5gE9jIV8Y_FG8k-Kv_NuT1HFB5S0jMPe82rNcr4';
const adminClient = createClient(
  'https://tqcdplapyymjbilraigg.supabase.co',
  SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testLogin() {
  console.log('🔐 Testando login...\n');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'brayanalexguarnieri@gmail.com',
    password: 'Brayan@Flow2026'
  });
  
  if (error) {
    console.log('❌ ERRO NO LOGIN:', error.message);
    
    // Diagnóstico via Admin API
    console.log('\n🔍 Diagnosticando status do usuário via Admin API...');
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Erro ao listar usuários:', listError.message);
    } else {
      const user = usersData.users.find(u => u.email === 'brayanalexguarnieri@gmail.com');
      if (user) {
        console.log('✅ Usuário localizado no Auth:');
        console.log('   ID:', user.id);
        console.log('   Confirmado:', user.email_confirmed_at ? 'SIM (' + user.email_confirmed_at + ')' : 'NÃO');
        console.log('   Último Login:', user.last_sign_in_at || 'Nunca');
      } else {
        console.log('❌ Usuário "brayanalexguarnieri@gmail.com" NÃO EXISTE no banco de dados.');
      }
    }
    
  } else {
    console.log('✅ LOGIN FUNCIONOU!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Token válido até:', new Date(data.session.expires_at * 1000).toLocaleString());
  }
}

testLogin();
