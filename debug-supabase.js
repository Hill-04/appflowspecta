import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function testSupabase() {
  console.log("\n🔍 TESTANDO CONEXÃO SUPABASE\n");

  // Ler variáveis
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.log("URL:", url ? "✅ Configurada" : "❌ FALTANDO");
  console.log("Key:", key ? "✅ Configurada" : "❌ FALTANDO");

  if (!url || !key) {
    console.error("\n❌ Variáveis de ambiente faltando!\n");
    return;
  }

  try {
    // Criar client
    const supabase = createClient(url, key);
    console.log("\n✅ Client criado com sucesso\n");

    // Testar conexão simples
    const { data, error } = await supabase.from("profiles").select("count").limit(1);

    if (error) {
      console.error("⚠️  Erro na query:", error.message);
    } else {
      console.log("✅ Conexão com database OK!");
      console.log("Resposta:", data);
    }
  } catch (err) {
    console.error("❌ Erro ao criar client:", err.message);
  }
}

testSupabase();
