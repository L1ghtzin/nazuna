import os from 'os';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createProgressBar(percent, length = 10) {
    const p = isNaN(percent) ? 0 : Math.max(0, Math.min(100, percent));
    const filledLength = Math.round(length * p / 100);
    return '█'.repeat(filledLength) + ' '.repeat(length - filledLength);
}

async function getDiskSpaceInfo() {
  try {
    const platform = os.platform();
    let totalBytes = 0;
    let freeBytes = 0;
    const defaultResult = { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };
    
    if (platform === 'win32') {
      try {
        const scriptPath = __dirname;
        const driveLetter = path.parse(scriptPath).root.charAt(0);
        const command = `fsutil volume diskfree ${driveLetter}:`;
        const output = execSync(command).toString();
        const lines = output.split('\n');
        const freeLine = lines.find(line => line.includes('Total # of free bytes'));
        const totalLine = lines.find(line => line.includes('Total # of bytes'));
        if (freeLine) freeBytes = parseFloat(freeLine.split(':')[1].trim().replace(/\./g, ''));
        if (totalLine) totalBytes = parseFloat(totalLine.split(':')[1].trim().replace(/\./g, ''));
      } catch (winError) {
        return defaultResult;
      }
    } else if (platform === 'linux' || platform === 'darwin') {
      try {
        const command = 'df -k .';
        const output = execSync(command).toString();
        const lines = output.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/);
          totalBytes = parseInt(parts[1]) * 1024;
          freeBytes = parseInt(parts[3]) * 1024;
        }
      } catch (unixError) {
        return defaultResult;
      }
    } else {
      return defaultResult;
    }
    
    if (totalBytes > 0 && freeBytes >= 0) {
      const usedBytes = totalBytes - freeBytes;
      const totalGb = (totalBytes / 1024 / 1024 / 1024).toFixed(2);
      const freeGb = (freeBytes / 1024 / 1024 / 1024).toFixed(2);
      const usedGb = (usedBytes / 1024 / 1024 / 1024).toFixed(2);
      const percentUsed = (usedBytes / totalBytes * 100).toFixed(1) + '%';
      return { totalGb, freeGb, usedGb, percentUsed };
    } else {
      return defaultResult;
    }
  } catch (error) {
    return { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };
  }
}

export default {
  name: "bot_info",
  description: "Informações detalhadas sobre o bot e o servidor",
  commands: ["infobot", "statusbot", "botinfo", "infoserver", "meustatus", "topcmd", "topcmds", "comandosmaisusados", "cmdinfo", "comandoinfo", "statusgp", "dadosgp", "horariomundial"],
  handle: async ({ 
    nazu, from, reply, formatUptime, getTotalCommands, pushname, nomebot, botVersion,
    isGroup, groupMetadata, sender, command, isOwner, info, MESSAGES,
    botState, isRentalModeActive, premiumListaZinha, globalBlocks, nomedono
  }) => {
    const cmd = command.toLowerCase();

    // --- INFO DO GRUPO ---
    if (['statusgp', 'dadosgp'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      const metadata = await nazu.groupMetadata(from);
      let teks = `🏢 *DADOS DO GRUPO*\n\n`;
      teks += `📌 *Nome:* ${metadata.subject}\n`;
      teks += `👥 *Membros:* ${metadata.participants.length}\n`;
      teks += `👑 *Criador:* @${metadata.owner?.split('@')[0] || 'N/A'}\n`;
      teks += `📝 *Descrição:* ${metadata.desc || 'Sem descrição'}`;
      return reply(teks, { mentions: [metadata.owner].filter(Boolean) });
    }

    // --- INFOSERVER (DIAGNÓSTICO COMPLETO PARA DONO) ---
    if (['infoserver'].includes(cmd)) {
      if (!isOwner) {
        return reply('🚫 *Ops! Você não tem permissão!* 😅\n\n🌸 *Este comando é só para o dono*\nInformações do servidor são confidenciais! ✨');
      }
      
      const serverUptime = process.uptime();
      const serverUptimeFormatted = formatUptime(serverUptime, true);
      const serverMemUsage = process.memoryUsage();
      const serverMemUsed = (serverMemUsage.heapUsed / 1024 / 1024).toFixed(2);
      const serverMemTotal = (serverMemUsage.heapTotal / 1024 / 1024).toFixed(2);
      const serverMemRss = (serverMemUsage.rss / 1024 / 1024).toFixed(2);
      const serverMemExternal = (serverMemUsage.external / 1024 / 1024).toFixed(2);
      
      const serverCpuUsage = process.cpuUsage();
      const serverCpuUser = (serverCpuUsage.user / 1000000).toFixed(2);
      const serverCpuSystem = (serverCpuUsage.system / 1000000).toFixed(2);
      
      const serverOsInfo = {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        type: os.type(),
        endianness: os.endianness()
      };
      
      const serverFreeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const serverTotalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const serverLoadAvg = os.loadavg();
      const serverCpuCount = os.cpus().length;
      const serverCpuModel = os.cpus()[0]?.model || 'Desconhecido';
      const serverNetworkInterfaces = os.networkInterfaces();
      const serverInterfaces = Object.keys(serverNetworkInterfaces).length;
      
      const currentServerTime = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      
      const nodeVersion = process.version;
      const osUptime = (os.uptime() / 3600).toFixed(2);
      
      let networkDetails = '';
      for (const [name, interfaces] of Object.entries(serverNetworkInterfaces)) {
        interfaces.forEach(iface => {
          networkDetails += `├ ${name} (${iface.family}): ${iface.address}\n`;
        });
      }
      
      let diskInfo = await getDiskSpaceInfo();
      const diskFree = diskInfo.freeGb;
      const diskTotal = diskInfo.totalGb;
      const diskUsed = diskInfo.usedGb;
      const diskUsagePercent = diskInfo.percentUsed;
      
      const startUsage = process.cpuUsage();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const endUsage = process.cpuUsage(startUsage);
      const cpuPercent = ((endUsage.user + endUsage.system) / 10000).toFixed(1);
      
      const startTime = Date.now();
      let networkLatency = 'N/A';
      try {
        const startNetworkTest = Date.now();
        await new Promise((resolve, reject) => {
          const req = https.get('https://www.google.com', res => {
            res.on('data', () => {});
            res.on('end', () => resolve());
          });
          req.on('error', err => reject(err));
          req.setTimeout(5000, () => reject(new Error('Timeout')));
        });
        const endNetworkTest = Date.now();
        networkLatency = `${endNetworkTest - startNetworkTest}ms`;
      } catch (error) {
        networkLatency = 'Erro ao testar';
      }
      const endTime = Date.now();
      const latency = endTime - startTime;

      let infoServerMessage = `🌸 ═════════════════════ 🌸\n`;
      infoServerMessage += `    *INFORMAÇÕES DO SERVIDOR*\n`;
      infoServerMessage += `🌸 ═════════════════════ 🌸\n\n`;
      
      infoServerMessage += `🖥️ *Sistema Operacional:* 🏠\n`;
      infoServerMessage += `├ 🟢 Node.js: ${nodeVersion}\n`;
      infoServerMessage += `├ 💻 Plataforma: ${serverOsInfo.platform}\n`;
      infoServerMessage += `├ 🏗️ Arquitetura: ${serverOsInfo.arch}\n`;
      infoServerMessage += `├ 🔧 Tipo: ${serverOsInfo.type}\n`;
      infoServerMessage += `├ 📋 Release: ${serverOsInfo.release}\n`;
      infoServerMessage += `├ 🏷️ Hostname: ${serverOsInfo.hostname}\n`;
      infoServerMessage += `├ 🔄 Endianness: ${serverOsInfo.endianness}\n`;
      infoServerMessage += `├ ⏳ Sistema online há: ${osUptime} horas\n`;
      infoServerMessage += `└ 📅 Hora atual: ${currentServerTime}\n\n`;
      
      infoServerMessage += `⚡ *Processador (CPU):* 🧠\n`;
      infoServerMessage += `├ 🔢 Núcleos: ${serverCpuCount}\n`;
      infoServerMessage += `├ 🏷️ Modelo: ${serverCpuModel}\n`;
      infoServerMessage += `├ 👤 Tempo usuário: ${serverCpuUser}s\n`;
      infoServerMessage += `├ ⚙️ Tempo sistema: ${serverCpuSystem}s\n`;
      infoServerMessage += `├ 📈 Uso CPU atual: ${cpuPercent}%\n`;
      infoServerMessage += `├ 📊 Load 1min: ${serverLoadAvg[0].toFixed(2)}\n`;
      infoServerMessage += `├ 📈 Load 5min: ${serverLoadAvg[1].toFixed(2)}\n`;
      infoServerMessage += `└ 📉 Load 15min: ${serverLoadAvg[2].toFixed(2)}\n\n`;
      
      const usedMemGb = (serverTotalMemory - serverFreeMemory);
      const memPercent = (usedMemGb / serverTotalMemory) * 100;
      infoServerMessage += `💾 *Memória do Sistema:* 🧠\n`;
      infoServerMessage += `├ 🆓 RAM Livre: ${serverFreeMemory} GB\n`;
      infoServerMessage += `├ 📊 RAM Total: ${serverTotalMemory} GB\n`;
      infoServerMessage += `├ 📈 RAM Usada: ${usedMemGb.toFixed(2)} GB\n`;
      infoServerMessage += `└ ⚠️ Uso: [${createProgressBar(memPercent)}] ${memPercent.toFixed(1)}%\n\n`;

      const botNameCap = nomebot.charAt(0).toUpperCase() + nomebot.slice(1);
      const heapPercent = (serverMemUsage.heapUsed / serverMemUsage.heapTotal) * 100;
      infoServerMessage += `🤖 *Memória da ${botNameCap}:* 💖\n`;
      infoServerMessage += `├ 🧠 Heap Usado: ${serverMemUsed} MB\n`;
      infoServerMessage += `├ 📦 Heap Total: ${serverMemTotal} MB\n`;
      infoServerMessage += `├ 🏠 RSS: ${serverMemRss} MB\n`;
      infoServerMessage += `├ 🔗 Externo: ${serverMemExternal} MB\n`;
      infoServerMessage += `└ ⚠️ Eficiência: [${createProgressBar(heapPercent)}] ${heapPercent.toFixed(1)}%\n\n`;
      
      infoServerMessage += `🌐 *Rede e Conectividade:* 🔗\n`;
      infoServerMessage += `├ 🔌 Interfaces: ${serverInterfaces}\n`;
      infoServerMessage += `${networkDetails}`;
      infoServerMessage += `├ 📡 Status: Online\n`;
      infoServerMessage += `├ ⏱️ Latência de Rede: ${networkLatency}\n`;
      infoServerMessage += `└ 🛡️ Firewall: Ativo\n\n`;

      const dp = parseFloat(diskUsagePercent);
      infoServerMessage += `💽 *Armazenamento:* 💿\n`;
      infoServerMessage += `├ 🆓 Livre: ${diskFree} GB\n`;
      infoServerMessage += `├ 📊 Total: ${diskTotal} GB\n`;
      infoServerMessage += `├ 📈 Usado: ${diskUsed} GB\n`;
      infoServerMessage += `└ ✅ Uso: [${createProgressBar(dp)}] ${diskUsagePercent}\n\n`;

      infoServerMessage += `⏰ *Tempo e Latência:* 🕐\n`;
      infoServerMessage += `├ ⏱️ Latência do Bot: ${latency}ms\n`;
      infoServerMessage += `└ 🚀 Bot online há: ${serverUptimeFormatted}`;

      return reply(infoServerMessage);
    }

    // --- INFOBOT / STATUSBOT (PÚBLICO) ---
    if (['infobot', 'statusbot', 'botinfo', 'meustatus'].includes(cmd)) {
      const botUptime = formatUptime(process.uptime(), true);
      const botMemUsage = process.memoryUsage();
      const memUsed = (botMemUsage.heapUsed / 1024 / 1024).toFixed(2);
      const memTotal = (botMemUsage.heapTotal / 1024 / 1024).toFixed(2);
      
      const allGroups = await nazu.groupFetchAllParticipating();
      const totalGroups = Object.keys(allGroups).length;
      let totalUsers = 0;
      Object.values(allGroups).forEach(group => {
        totalUsers += group.participants?.length || 0;
      });
      
      const botStatus = botState?.status === 'on' ? '✅ Online' : `💔 Offline`;
      const rentalMode = isRentalModeActive && isRentalModeActive() ? '✅ Ativo' : `💔 Desativo`;
      const nodeV = process.version;
      const platform = os.platform();
      const totalCmds = getTotalCommands ? getTotalCommands() : 0;
      
      const premLista = premiumListaZinha || {};
      const premiumUsers = Object.keys(premLista).filter(key => key.endsWith('@s.whatsapp.net')).length;
      const premiumGroups = Object.keys(premLista).filter(key => key.endsWith('@g.us')).length;
      
      const blocks = globalBlocks || {};
      const blockedUsersCount = Object.keys(blocks.users || {}).length;
      const blockedCommandsCount = Object.keys(blocks.commands || {}).length;
      
      const currentTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      const lines = [
        "╭───🤖 STATUS DO BOT ───╮",
        `┊ 🏷️ Nome: ${nomebot}`,
        `┊ 👨‍💻 Dono: ${nomedono}`,
        `┊ 🆚 Versão: ${botVersion}`,
        `┊ 🟢 Status: ${botStatus}`,
        `┊ ⏰ Online há: ${botUptime}`,
        `┊ 🖥️ Plataforma: ${platform}`,
        `┊ 🟢 Node.js: ${nodeV}`,
        "┊",
        "┊ 📊 *Estatísticas:*",
        `┊ • 👥 Grupos: ${totalGroups}`,
        `┊ • 👤 Usuários: ${totalUsers}`,
        `┊ • ⚒️ Comandos: ${totalCmds}`,
        `┊ • 💎 Users Premium: ${premiumUsers}`,
        `┊ • 💎 Grupos Premium: ${premiumGroups}`,
        "┊",
        "┊ 🛡️ *Segurança:*",
        `┊ • 🚫 Users Bloqueados: ${blockedUsersCount}`,
        `┊ • 🚫 Cmds Bloqueados: ${blockedCommandsCount}`,
        `┊ • 🏠 Modo Aluguel: ${rentalMode}`,
        "┊",
        "┊ 💾 *Sistema:*",
        `┊ • 🧠 RAM Usada: ${memUsed}MB`,
        `┊ • 📦 RAM Total: ${memTotal}MB`,
        `┊ • 🕐 Hora Atual: ${currentTime}`,
        "╰───────────────╯"
      ].join("\n");
      
      return reply(lines);
    }
  }
};
