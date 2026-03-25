/**
 * FLOWSPECTA - SETUP AUTOMATICO COMPLETO
 *
 * Este script faz TUDO automaticamente:
 * 1. Verifica se .env existe (cria se nao)
 * 2. Instala dependencias (se necessario)
 * 3. Inicia servidor
 * 4. Faz login automatico
 * 5. Extrai USER_JWT e USER_ID
 * 6. Configura Orchestrator
 * 7. Testa sistema completo
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import http from "node:http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  supabaseUrl: "https://tqcdplapyymjbilraigg.supabase.co",
  supabaseKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY2RwbGFweXltamJpbHJhaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjU5ODksImV4cCI6MjA4NjMwMTk4OX0.z9Td45SOSlBpNZZyB4R1Bsn0ax9jujt2Md_3jW3IEX4",
  email: "brayanalexguarnieri@gmail.com",
  password: "Brayan241008",
  localUrl: "http://localhost:5173",
  flowspectaDir: __dirname,
  orchestratorDir: path.join(__dirname, "..", "jarvis-orchestrator"),
  megaBrainDir: path.join(__dirname, "..", "mega-brain"),
};

let puppeteer;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      shell: true,
      stdio: "inherit",
      ...options,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} falhou com codigo ${code}`));
      }
    });
    proc.on("error", reject);
  });
}

async function waitForHttp(url, timeoutMs = 45000, intervalMs = 1500) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(Boolean(res.statusCode && res.statusCode < 500));
      });
      req.on("error", () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (ok) return true;
    await sleep(intervalMs);
  }
  return false;
}

async function step1_CheckEnv() {
  console.log("\n[1/6] Verificando .env...\n");
  const envPath = path.join(CONFIG.flowspectaDir, ".env");

  if (fs.existsSync(envPath)) {
    console.log("OK: .env ja existe");
    return;
  }

  const envContent = `VITE_SUPABASE_URL=${CONFIG.supabaseUrl}\nVITE_SUPABASE_ANON_KEY=${CONFIG.supabaseKey}\n`;
  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("OK: .env criado");
}

async function step2_InstallDeps() {
  console.log("\n[2/6] Verificando dependencias...\n");
  const nodeModulesPath = path.join(CONFIG.flowspectaDir, "node_modules");

  if (!fs.existsSync(nodeModulesPath)) {
    console.log("Instalando dependencias do projeto...");
    await runCommand("npm", ["install"], { cwd: CONFIG.flowspectaDir });
    console.log("OK: dependencias principais instaladas");
  } else {
    console.log("OK: node_modules ja existe");
  }

  try {
    await import("puppeteer");
    console.log("OK: puppeteer ja disponivel");
  } catch {
    console.log("Instalando puppeteer...");
    await runCommand("npm", ["install", "puppeteer"], { cwd: CONFIG.flowspectaDir });
    console.log("OK: puppeteer instalado");
  }

  const imported = await import("puppeteer");
  puppeteer = imported.default ?? imported;
}

async function step3_StartServer() {
  console.log("\n[3/6] Iniciando servidor...\n");

  const outPath = path.join(CONFIG.flowspectaDir, "setup-dev-server.log");
  const out = fs.openSync(outPath, "a");
  const err = fs.openSync(outPath, "a");

  const server = spawn("npm", ["run", "dev"], {
    cwd: CONFIG.flowspectaDir,
    shell: true,
    detached: true,
    stdio: ["ignore", out, err],
  });

  server.unref();
  console.log(`Processo do servidor iniciado. PID: ${server.pid ?? "N/A"}`);
  console.log("Aguardando servidor responder...");

  const isUp = await waitForHttp(CONFIG.localUrl);
  if (!isUp) {
    throw new Error(`Servidor nao respondeu em ${CONFIG.localUrl}. Verifique ${outPath}`);
  }
  console.log("OK: servidor acessivel em http://localhost:5173");

  return server;
}

async function step4_AutoLogin() {
  console.log("\n[4/6] Fazendo login automatico...\n");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage();

  try {
    console.log("Abrindo FlowSpecta...");
    await page.goto(CONFIG.localUrl, { waitUntil: "networkidle2", timeout: 45000 });

    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    await page.type('input[type="email"]', CONFIG.email, { delay: 20 });
    await page.type('input[type="password"]', CONFIG.password, { delay: 20 });

    const clicked = await page.evaluate(() => {
      const submit = document.querySelector('button[type="submit"]');
      if (submit) {
        submit.click();
        return true;
      }

      const buttons = Array.from(document.querySelectorAll("button"));
      const loginBtn = buttons.find((btn) => /entrar|login|sign in/i.test(btn.textContent || ""));
      if (loginBtn) {
        loginBtn.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      throw new Error("Nao foi possivel localizar o botao de login.");
    }

    await sleep(5000);

    const credentials = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );
      if (!key) return null;

      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return {
        jwt: parsed?.access_token || "",
        userId: parsed?.user?.id || "",
        email: parsed?.user?.email || "",
      };
    });

    if (!credentials?.jwt || !credentials?.userId) {
      throw new Error("Credenciais nao encontradas no localStorage apos login.");
    }

    console.log("\nCREDENCIAIS EXTRAIDAS:");
    console.log("Email:", credentials.email);
    console.log("User ID:", credentials.userId);
    console.log("JWT:", credentials.jwt.slice(0, 60) + "...");

    await browser.close();
    return credentials;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function step5_ConfigureOrchestrator(credentials) {
  console.log("\n[5/6] Configurando Orchestrator...\n");

  if (!fs.existsSync(CONFIG.orchestratorDir)) {
    throw new Error(`Diretorio do Orchestrator nao encontrado: ${CONFIG.orchestratorDir}`);
  }

  const envPath = path.join(CONFIG.orchestratorDir, ".env");
  const envContent = `FLOWSPECTA_URL=${CONFIG.supabaseUrl}
FLOWSPECTA_ANON_KEY=${CONFIG.supabaseKey}

USER_JWT=${credentials.jwt}
USER_ID=${credentials.userId}

CAMPAIGN_ID_DENTISTAS=
CAMPAIGN_ID_ADVOGADOS=
CAMPAIGN_ID_FITNESS=

MEGA_BRAIN_PATH=${CONFIG.megaBrainDir}
`;

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("OK: .env do Orchestrator atualizado");
}

async function step6_TestSystem() {
  console.log("\n[6/6] Testando sistema...\n");

  if (!fs.existsSync(CONFIG.orchestratorDir)) {
    console.log("Aviso: orchestrator nao encontrado, pulando testes.");
    return;
  }

  try {
    await runCommand("npm", ["test"], { cwd: CONFIG.orchestratorDir });
    console.log("\nOK: testes passaram");
  } catch (error) {
    console.log(`\nAviso: testes com problemas (${error.message}). Continuando sem falhar setup.`);
  }
}

async function main() {
  console.log("==============================================");
  console.log("     FLOWSPECTA - SETUP AUTOMATICO COMPLETO");
  console.log("==============================================\n");

  try {
    await step1_CheckEnv();
    await step2_InstallDeps();
    await step3_StartServer();
    const credentials = await step4_AutoLogin();
    await step5_ConfigureOrchestrator(credentials);
    await step6_TestSystem();

    console.log("\n==============================================");
    console.log("           SETUP COMPLETO COM SUCESSO");
    console.log("==============================================\n");
    console.log("Proximos passos:");
    console.log("1. Obter Campaign IDs do Supabase");
    console.log("2. Testar prospeccao real");
    console.log("3. Deploy em producao\n");
    console.log("Servidor FlowSpecta continua rodando em http://localhost:5173");
    console.log("Para parar: encerre o processo do dev server manualmente.");
  } catch (error) {
    console.error("\nERRO:", error.message);
    console.error("\nStack:", error.stack);
    process.exit(1);
  }
}

main();
