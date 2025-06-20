#!/usr/bin/env node


const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const readline = require('readline');
const os = require('os');
const { promisify } = require('util');
const execAsync = promisify(exec);


const CONFIG_FILE = path.join(process.cwd(), 'dados', 'src', 'config.json');
const isWindows = os.platform() === 'win32';


let version = 'Desconhecida';
try {
  const packageJson = JSON.parse(fsSync.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  version = packageJson.version;
} catch (error) {

};


const colors = {
  reset: '\x1b[0m',
  green: '\x1b[1;32m',
  red: '\x1b[1;31m',
  blue: '\x1b[1;34m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[1;36m',
  magenta: '\x1b[1;35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  underline: '\x1b[4m'
};


function printMessage(text) {
  console.log(`${colors.green}${text}${colors.reset}`);
};

function printWarning(text) {
  console.log(`${colors.red}${text}${colors.reset}`);
};

function printInfo(text) {
  console.log(`${colors.cyan}${text}${colors.reset}`);
};

function printDetail(text) {
  console.log(`${colors.dim}${text}${colors.reset}`);
};

function printSeparator() {
  console.log(`${colors.blue}============================================${colors.reset}`);
};


function validateInput(input, field) {
  switch (field) {
    case 'prefixo':
      if (input.length !== 1) {
        printWarning(`❌ O prefixo deve ter exatamente 1 caractere.`);
        return false;
      };
      return true;
      
    case 'numero':
      if (!/^[0-9]{10,15}$/.test(input)) {
        printWarning(`❌ O número deve conter apenas dígitos (10-15 caracteres).`);
        printDetail(`   Exemplo: 5511987654321 (sem símbolos ou espaços)`);
        return false;
      };
      return true;
      
    default:
      return true;
  };
};


function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('\n');
    printWarning('🛑 Configuração cancelada pelo usuário.');
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};


async function installDependencies() {
  printSeparator();
  printMessage("📦 Instalando dependências...");
  
  try {
    const installCommand = isWindows ? 'npm install --no-optional --force --no-bin-links' : 'npm install --no-optional --force --no-bin-links';

    await new Promise((resolve, reject) => {
      const npmProcess = exec(installCommand, (error) => {
        if (error) reject(error);
        else resolve();
      });
      
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let i = 0;
      const interval = setInterval(() => {
        process.stdout.write(`\r${spinner[i]} Instalando dependências...`);
        i = (i + 1) % spinner.length;
      }, 100);
      
      npmProcess.on('close', () => {
        clearInterval(interval);
        process.stdout.write('\r                                \r');
      });
    });
    
    printMessage("✔ Instalação concluída! Rode 'npm start' para iniciar o bot.");
  } catch (error) {
    printWarning(`❌ Erro na instalação: ${error.message}`);
    printInfo("ℹ️ Você pode tentar instalar manualmente com: npm install --force");
    process.exit(1);
  };
};


async function displayHeader() {
  const header = [
    `${colors.bold}🔧 Configurador da Nazuna - v${version}${colors.reset}`,
    `${colors.bold}🚀 Criado por Hiudy${colors.reset}`
  ];
  
  printSeparator();

  for (const line of header) {
    await new Promise(resolve => {
      process.stdout.write(line + '\n');
      setTimeout(resolve, 100);
    });
  }
  
  printSeparator();
  console.log();
};


async function main() {
  try {
    setupGracefulShutdown();

    if (process.argv.includes('--install')) {
      await installDependencies();
      process.exit(0);
    };

    await displayHeader();

    const defaultConfig = {
      nomedono: "",
      numerodono: "",
      nomebot: "",
      prefixo: "!",
      aviso: false,
      debug: false,
      enablePanel: false
    };
    
    let config = { ...defaultConfig };
    
    try {
      if (fsSync.existsSync(CONFIG_FILE)) {
        const existingConfig = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'));
        config = { ...config, ...existingConfig };
        printInfo("ℹ️ Configuração existente carregada.");
      }
    } catch (error) {
      printWarning(`⚠ Erro ao ler configuração existente: ${error.message}`);
      printInfo("ℹ️ Usando valores padrão.");
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    printInfo(`${colors.bold}${colors.underline}CONFIGURAÇÃO BÁSICA${colors.reset}`);
    config.nomedono = await promptInput(rl, "👤 Qual seu nome?", config.nomedono);
    config.numerodono = await promptInput(rl, "📞 Qual seu número (somente dígitos, 10-15)?", config.numerodono, "numero");
    config.nomebot = await promptInput(rl, "🤖 Qual o nome do bot?", config.nomebot);
    config.prefixo = await promptInput(rl, "⚙️ Qual o prefixo (1 caractere)?", config.prefixo, "prefixo");

    config.aviso = false;
    config.debug = false;
    config.enablePanel = false;

    try {
      const configDir = path.dirname(CONFIG_FILE);
      if (!fsSync.existsSync(configDir)) {
        await fs.mkdir(configDir, { recursive: true });
      }

      await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));

      console.log();
      printInfo("📋 Resumo da configuração:");
      printDetail(`   Nome: ${config.nomedono}`);
      printDetail(`   Número: ${config.numerodono}`);
      printDetail(`   Nome do Bot: ${config.nomebot}`);
      printDetail(`   Prefixo: ${config.prefixo}`);

      printSeparator();
      printMessage("🎉 Configuração concluída com sucesso!");
      printSeparator();
      
      const installNow = await confirm(rl, "📦 Instalar dependências agora?", "s");
      
      if (installNow) {
        rl.close();
        await installDependencies();
      } else {
        printMessage("⚡ Para instalar depois, use: npm run config:install");
      }
      
      printSeparator();
      printMessage(`🚀 Nazuna pronta para uso! - v${version}`);
      printSeparator();
    } catch (error) {
      printWarning(`❌ Erro ao salvar configuração: ${error.message}`);
    }
    
    rl.close();
  } catch (error) {
    printWarning(`❌ Erro inesperado: ${error.message}`);
    process.exit(1);
  }
}


async function promptInput(rl, prompt, defaultValue, field = null) {
  return new Promise((resolve) => {
    const displayPrompt = `${prompt} ${colors.dim}(Atual: ${defaultValue || 'Não definido'})${colors.reset}: `;
    rl.question(displayPrompt, (input) => {
      const value = input.trim() || defaultValue;
      
      if (field && !validateInput(value, field)) {
        return promptInput(rl, prompt, defaultValue, field).then(resolve);
      }
      
      resolve(value);
    });
  });
}


async function confirm(rl, prompt, defaultValue = 'n') {
  return new Promise((resolve) => {
    const defaultText = defaultValue.toLowerCase() === 's' ? 'S/n' : 's/N';
    rl.question(`${prompt} (${defaultText}): `, (input) => {
      const response = (input.trim() || defaultValue).toLowerCase();
      resolve(response === 's' || response === 'sim' || response === 'y' || response === 'yes');
    });
  });
}


main().catch(error => {
  printWarning(`❌ Erro fatal: ${error.message}`);
  process.exit(1);
}); 