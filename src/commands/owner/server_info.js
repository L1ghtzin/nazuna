import os from 'os';
import { execSync } from 'child_process';
import https from 'https';

function createProgressBar(percent, length = 10) {
  const value = Number.isNaN(percent) ? 0 : Math.max(0, Math.min(100, percent));
  const filledLength = Math.round(length * value / 100);
  return '#'.repeat(filledLength) + '-'.repeat(length - filledLength);
}

async function getDiskSpaceInfo() {
  const defaultResult = { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };

  try {
    const platform = os.platform();
    let totalBytes = 0;
    let freeBytes = 0;

    if (platform === 'win32') {
      try {
        const driveLetter = process.cwd().slice(0, 1);
        const output = execSync(`fsutil volume diskfree ${driveLetter}:`).toString();
        const lines = output.split('\n');
        const freeLine = lines.find(line => line.includes('Total # of free bytes'));
        const totalLine = lines.find(line => line.includes('Total # of bytes'));
        if (freeLine) freeBytes = parseFloat(freeLine.split(':')[1].trim().replace(/\./g, ''));
        if (totalLine) totalBytes = parseFloat(totalLine.split(':')[1].trim().replace(/\./g, ''));
      } catch {
        return defaultResult;
      }
    } else if (platform === 'linux' || platform === 'darwin') {
      try {
        const output = execSync('df -k .').toString();
        const lines = output.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/);
          totalBytes = parseInt(parts[1], 10) * 1024;
          freeBytes = parseInt(parts[3], 10) * 1024;
        }
      } catch {
        return defaultResult;
      }
    } else {
      return defaultResult;
    }

    if (totalBytes <= 0 || freeBytes < 0) return defaultResult;

    const usedBytes = totalBytes - freeBytes;
    return {
      totalGb: (totalBytes / 1024 / 1024 / 1024).toFixed(2),
      freeGb: (freeBytes / 1024 / 1024 / 1024).toFixed(2),
      usedGb: (usedBytes / 1024 / 1024 / 1024).toFixed(2),
      percentUsed: `${(usedBytes / totalBytes * 100).toFixed(1)}%`
    };
  } catch {
    return defaultResult;
  }
}

async function measureNetworkLatency() {
  const startedAt = Date.now();

  try {
    await new Promise((resolve, reject) => {
      const req = https.get('https://www.google.com', res => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
    return `${Date.now() - startedAt}ms`;
  } catch {
    return 'Erro ao testar';
  }
}

export default {
  name: "server_info",
  description: "Diagnostico completo do servidor",
  commands: ["infoserver"],
  handle: async ({ reply, formatUptime, nomebot, MESSAGES }) => {
    const serverUptimeFormatted = formatUptime(process.uptime(), true);
    const serverMemUsage = process.memoryUsage();
    const serverMemUsed = (serverMemUsage.heapUsed / 1024 / 1024).toFixed(2);
    const serverMemTotal = (serverMemUsage.heapTotal / 1024 / 1024).toFixed(2);
    const serverMemRss = (serverMemUsage.rss / 1024 / 1024).toFixed(2);
    const serverMemExternal = (serverMemUsage.external / 1024 / 1024).toFixed(2);

    const serverCpuUsage = process.cpuUsage();
    const serverCpuUser = (serverCpuUsage.user / 1000000).toFixed(2);
    const serverCpuSystem = (serverCpuUsage.system / 1000000).toFixed(2);
    const serverLoadAvg = os.loadavg();
    const serverCpuCount = os.cpus().length;
    const serverCpuModel = os.cpus()[0]?.model || 'Desconhecido';
    const serverNetworkInterfaces = os.networkInterfaces();
    const serverInterfaces = Object.keys(serverNetworkInterfaces).length;
    const serverTotalMemoryRaw = os.totalmem();
    const serverFreeMemoryRaw = os.freemem();
    const serverUsedMemoryRaw = Math.max(0, serverTotalMemoryRaw - serverFreeMemoryRaw);
    const serverFreeMemory = (serverFreeMemoryRaw / 1024 / 1024 / 1024).toFixed(2);
    const serverTotalMemory = (serverTotalMemoryRaw / 1024 / 1024 / 1024).toFixed(2);
    const usedMemGb = serverUsedMemoryRaw / 1024 / 1024 / 1024;
    const memPercent = serverTotalMemoryRaw > 0 ? (serverUsedMemoryRaw / serverTotalMemoryRaw) * 100 : 0;
    const heapPercent = serverMemUsage.heapTotal > 0 ? (serverMemUsage.heapUsed / serverMemUsage.heapTotal) * 100 : 0;
    const botNameCap = nomebot || 'Bot';

    const currentServerTime = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let networkDetails = '';
    for (const [name, interfaces] of Object.entries(serverNetworkInterfaces)) {
      interfaces.forEach(iface => {
        networkDetails += `- ${name} (${iface.family}): ${iface.address}\n`;
      });
    }

    const diskInfo = await getDiskSpaceInfo();
    const diskUsagePercent = diskInfo.percentUsed;
    const diskPercentValue = Number.parseFloat(diskUsagePercent) || 0;

    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const endUsage = process.cpuUsage(startUsage);
    const cpuPercent = ((endUsage.user + endUsage.system) / 10000).toFixed(1);
    const networkStartedAt = Date.now();
    const networkLatency = await measureNetworkLatency();
    const latency = Date.now() - networkStartedAt;

    return reply(MESSAGES.member.bot_info.serverInfo({
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
      endianness: os.endianness(),
      osUptime: (os.uptime() / 3600).toFixed(2),
      currentServerTime,
      serverCpuCount,
      serverCpuModel,
      serverCpuUser,
      serverCpuSystem,
      cpuPercent,
      serverLoadAvg0: serverLoadAvg[0].toFixed(2),
      serverLoadAvg1: serverLoadAvg[1].toFixed(2),
      serverLoadAvg2: serverLoadAvg[2].toFixed(2),
      serverFreeMemory,
      serverTotalMemory,
      usedMemGb: usedMemGb.toFixed(2),
      memProgressBar: createProgressBar(memPercent),
      memPercent: memPercent.toFixed(1),
      botNameCap,
      serverMemUsed,
      serverMemTotal,
      serverMemRss,
      serverMemExternal,
      heapProgressBar: createProgressBar(heapPercent),
      heapPercent: heapPercent.toFixed(1),
      serverInterfaces,
      networkDetails,
      networkLatency,
      diskFree: diskInfo.freeGb,
      diskTotal: diskInfo.totalGb,
      diskUsed: diskInfo.usedGb,
      diskProgressBar: createProgressBar(diskPercentValue),
      diskUsagePercent,
      latency,
      serverUptimeFormatted
    }));
  }
};
