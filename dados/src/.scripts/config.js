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
}

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
  underline: '\x1b[4m',
};

function printMessage(text) {
  console.log(`${colors.green}${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.red}${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.cyan}${text}${colors.reset}`);
}

function printDetail(text) {
  console.log(`${colors.dim}${text}${colors.reset}`);
}

function printSeparator() {
  console.log(`${colors.blue}============================================${colors.reset}`);
}

function validateInput(input, field) {
  switch (field) {
    case 'prefixo':
      if (input.length !== 1) {
        printWarning('⚠️ O prefixo deve ter exatamente 1 caractere.');
        return false;
      }
      return true;

    case 'numero':
      if (!/^[0-9]{10,15}$/.test(input)) {
        printWarning('⚠️ Número inválido! Deve conter apenas dígitos (10 a 15).');
        printDetail('📝 Exemplo: 5511999999999');
        return false;
      }
      return true;

    default:
      return true;
  }
}

function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('\n');
    printWarning('🛑 Configuração cancelada pelo usuário.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function isTermux() {
  try {
    return !!process.env.TERMUX_VERSION || (await execAsync('command -v pkg')).stdout.includes('termux');
  } catch {
    return false;
  }
}

async function installFFmpeg() {
  printSeparator();
  printMessage('📦 Instalando FFmpeg e ffprobe...');

  try {
    const platform = os.platform();
    let command;

    if (await isTermux()) {
      try {
        await execAsync('command -v pkg');
        command = 'pkg install ffmpeg -y';
      } catch {
        printWarning('⚠️ Termux detectado, mas pkg não encontrado.');
        printInfo('📝 Instale o FFmpeg e ffprobe manualmente no Termux: pkg install ffmpeg');
        return;
      }
    } else if (platform === 'linux') {
      try {
        await execAsync('command -v apt-get');
        command = 'sudo apt-get update && sudo apt-get install -y ffmpeg';
      } catch {
        try {
          await execAsync('command -v yum');
          command = 'sudo yum install -y ffmpeg';
        } catch {
          try {
            await execAsync('command -v dnf');
            command = 'sudo dnf install -y ffmpeg';
          } catch {
            printWarning('⚠️ Nenhum gerenciador de pacotes compatível (apt/yum/dnf) encontrado.');
            printInfo('📝 Instale o FFmpeg e ffprobe manualmente: https://ffmpeg.org/download.html');
            return;
          }
        }
      }
    } else if (platform === 'darwin') {
      try {
        await execAsync('command -v brew');
        command = 'brew install ffmpeg';
      } catch {
        printWarning('⚠️ Homebrew não encontrado. Instale o Homebrew primeiro: https://brew.sh');
        printInfo('📝 Após instalar o Homebrew, execute: brew install ffmpeg');
        return;
      }
    } else if (platform === 'win32') {
      try {
        await execAsync('winget --version');
        command = 'winget install --id Gyan.FFmpeg -e';
      } catch {
        printWarning('⚠️ winget não encontrado ou FFmpeg/ffprobe não instalado.');
        printInfo('📝 Baixe e instale o FFmpeg (inclui ffprobe) manualmente: https://ffmpeg.org/download.html');
        printDetail('📌 Adicione o FFmpeg ao PATH do sistema após a instalação.');
        return;
      }
    } else {
      printWarning('⚠️ Sistema operacional não suportado para instalação automática do FFmpeg/ffprobe.');
      printInfo('📝 Instale o FFmpeg e ffprobe manualmente: https://ffmpeg.org/download.html');
      return;
    }

    await new Promise((resolve, reject) => {
      const ffmpegProcess = exec(command, { shell: isWindows }, (error) =>
        error ? reject(error) : resolve()
      );

      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let i = 0;
      const interval = setInterval(() => {
        process.stdout.write(`\r${spinner[i]} Instalando FFmpeg e ffprobe...`);
        i = (i + 1) % spinner.length;
      }, 100);

      ffmpegProcess.on('close', () => {
        clearInterval(interval);
        process.stdout.write('\r                                \r');
      });
    });

    try {
      await execAsync('ffmpeg -version');
      printMessage('✅ FFmpeg instalado com sucesso.');
    } catch {
      printWarning('⚠️ FFmpeg instalado, mas não encontrado no PATH.');
      printInfo('📝 Certifique-se de que o FFmpeg está no PATH do sistema ou no ambiente Termux.');
    }

    try {
      await execAsync('ffprobe -version');
      printMessage('✅ ffprobe instalado com sucesso.');
    } catch {
      printWarning('⚠️ ffprobe instalado, mas não encontrado no PATH.');
      printInfo('📝 Certifique-se de que o ffprobe está no PATH do sistema ou no ambiente Termux.');
      printDetail('📌 ffprobe geralmente vem com o FFmpeg. Verifique a instalação do FFmpeg.');
    }
  } catch (error) {
    printWarning(`❌ Erro ao instalar FFmpeg/ffprobe: ${error.message}`);
    printInfo('📝 Instale o FFmpeg e ffprobe manualmente: https://ffmpeg.org/download.html');
  }
}

async function installDependencies() {
  printSeparator();
  printMessage('📦 Instalando dependências do Node.js...');

  try {
    await new Promise((resolve, reject) => {
      const npmProcess = exec('npm install --no-optional --force --no-bin-links', { shell: isWindows }, (error) =>
        error ? reject(error) : resolve()
      );

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

    printMessage('✅ Dependências do Node.js instaladas com sucesso.');
  } catch (error) {
    printWarning(`❌ Erro ao instalar dependências do Node.js: ${error.message}`);
    printInfo('📝 Tente executar manualmente: npm run config:install');
    process.exit(1);
  }

  await installFFmpeg();
}

async function checkSystemRequirements() {
  printSeparator();
  printMessage('🔍 Verificando requisitos do sistema...');

  try {
    const nodeVersion = await execAsync('node --version');
    printDetail(`✅ Node.js encontrado: ${nodeVersion.stdout.trim()}`);
  } catch {
    printWarning('⚠️ Node.js não encontrado. Instale o Node.js: https://nodejs.org ou no Termux: pkg install nodejs');
    process.exit(1);
  }

  try {
    const npmVersion = await execAsync('npm --version');
    printDetail(`✅ npm encontrado: ${npmVersion.stdout.trim()}`);
  } catch {
    printWarning('⚠️ npm não encontrado. Instale o Node.js com npm: https://nodejs.org ou no Termux: pkg install nodejs');
    process.exit(1);
  }

  if (await isTermux()) {
    printDetail('✅ Ambiente Termux detectado.');
  }

  printMessage('✅ Todos os requisitos do sistema verificados.');
}

async function displayHeader() {
  const header = [
    `${colors.bold}🚀 Configurador do Nazuna - Versão ${version}${colors.reset}`,
    `${colors.bold}👨‍💻 Criado por Hiudy${colors.reset}`,
  ];

  printSeparator();
  for (const line of header) {
    await new Promise((resolve) => {
      process.stdout.write(line + '\n');
      setTimeout(resolve, 100);
    });
  }
  printSeparator();
  console.log();
}

async function main() {
  try {
    setupGracefulShutdown();

    if (process.argv.includes('--install')) {
      await checkSystemRequirements();
      await installDependencies();
      process.exit(0);
    }

    await displayHeader();
    await checkSystemRequirements();

    const defaultConfig = {
      nomedono: '',
      numerodono: '',
      nomebot: '',
      prefixo: '!',
      aviso: false,
      debug: false,
      enablePanel: false,
    };

    let config = { ...defaultConfig };

    try {
      if (fsSync.existsSync(CONFIG_FILE)) {
        const existingConfig = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'));
        config = { ...config, ...existingConfig };
        printInfo('📂 Configuração existente carregada.');
      }
    } catch (error) {
      printWarning(`⚠️ Erro ao ler config.json: ${error.message}`);
      printInfo('📝 Usando valores padrão.');
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    printInfo(`${colors.bold}${colors.underline}🔧 Configurações Básicas${colors.reset}`);
    config.nomedono = await promptInput(rl, '👤 Nome do dono do bot', config.nomedono);
    config.numerodono = await promptInput(rl, '📱 Número do dono (com DDD, apenas dígitos)', config.numerodono, 'numero');
    config.nomebot = await promptInput(rl, '🤖 Nome do bot', config.nomebot);
    config.prefixo = await promptInput(rl, '🔣 Prefixo do bot (1 caractere)', config.prefixo, 'prefixo');

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
      printInfo('📋 Resumo da Configuração');
      printDetail(`👤 Nome do dono: ${config.nomedono}`);
      printDetail(`📱 Número do dono: ${config.numerodono}`);
      printDetail(`🤖 Nome do bot: ${config.nomebot}`);
      printDetail(`🔣 Prefixo: ${config.prefixo}`);

      printSeparator();
      printMessage('✅ Configuração salva com sucesso em config.json!');
      printSeparator();

      const installNow = await confirm(rl, '📦 Deseja instalar as dependências, FFmpeg e ffprobe agora?', 's');

      if (installNow) {
        rl.close();
        await installDependencies();
      } else {
        printMessage('📝 Você pode instalar as dependências, FFmpeg e ffprobe depois com: npm run config:install');
      }

      printSeparator();
      printMessage(`🎉 Nazuna configurado e pronto para uso! Versão: ${version}`);
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
    const displayPrompt = `${prompt} ${colors.dim}(atual: ${defaultValue})${colors.reset}: `;
    console.log(displayPrompt);
    rl.question("-->", async (input) => {
      const value = input.trim() || defaultValue;

      if (field && !validateInput(value, field)) {
        return resolve(await promptInput(rl, prompt, defaultValue, field));
      }

      resolve(value);
    });
  });
}

async function confirm(rl, prompt, defaultValue = 'n') {
  return new Promise((resolve) => {
    const defaultText = defaultValue.toLowerCase() === 's' ? 'S/n' : 's/N';
    console.log(`${prompt} (${defaultText}): `);
    rl.question("-->", (input) => {
      const response = (input.trim() || defaultValue).toLowerCase();
      resolve(response === 's' || response === 'sim' || response === 'y' || response === 'yes');
    });
  });
}

main().catch((error) => {
  printWarning(`❌ Erro fatal: ${error.message}`);
  process.exit(1);
});