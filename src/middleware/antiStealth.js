import { proto } from "baileys";
import { join } from 'path';
import { loadGroupData, persistGroupData } from '../utils/groupManager.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import config, { NUMERODONO } from '../config.js';
import { sendCleanChat } from '../utils/cleanChat.js';

const CIPHERTEXT_STUB = proto?.WebMessageInfo?.StubType?.CIPHERTEXT ?? 2;

const REPEAT_WINDOW_MS = 2 * 60 * 1000;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;
const TRACKER_TTL_MS = 10 * 60 * 1000;

const tracker = new Map();
let lastSweep = Date.now();

function sweep(now) {
  if (now - lastSweep < TRACKER_TTL_MS) return;
  lastSweep = now;
  for (const [key, entry] of tracker) {
    if (now - entry.windowStart > TRACKER_TTL_MS) tracker.delete(key);
  }
}

function registerFailure(trackerKey, now) {
  let entry = tracker.get(trackerKey);
  if (!entry || now - entry.windowStart > REPEAT_WINDOW_MS) {
    entry = { count: 0, windowStart: now, lastAlertAt: 0 };
  }
  entry.count += 1;
  tracker.set(trackerKey, entry);
  return entry;
}

function isOnCooldown(entry, now) {
  return entry.lastAlertAt && now - entry.lastAlertAt < ALERT_COOLDOWN_MS;
}

function classifyConfidence(webMessage) {
  const meta = webMessage?.stealthMeta;
  if (meta?.decryptFail === "hide") return "high";
  return null;
}

function shortJid(jid) {
  if (!jid) return "desconhecido";
  return jid.split("@")[0].split(":")[0];
}

function buildActionNotice(sender) {
  const number = shortJid(sender);
  return `🚨 *Anti-Payment (Stealth)*\n━━━━━━━━━━━━━━━━━━━━━━\nRemovi @${number}: tentou enviar uma cobrança *oculta e indecifrável* de forma direcionada (técnica usada para esconder pagamentos de admins e do bot).`;
}

async function runAntiPaymentStep(step, errorMessage) {
  try {
    await step();
  } catch (error) {
    console.error(`[ANTI-STEALTH] ${errorMessage} Detalhes: ${error.message}`);
  }
}

async function applyAntiPaymentRestriction({ NazunaSock, remoteJid, userLid }) {
  await runAntiPaymentStep(
    () => NazunaSock.groupSettingUpdate(remoteJid, "announcement"),
    "Erro ao fechar o grupo."
  );

  await runAntiPaymentStep(
    () => NazunaSock.groupParticipantsUpdate(remoteJid, [userLid], "remove"),
    "Erro ao banir membro."
  );

  await runAntiPaymentStep(
    () => sendCleanChat({ nazu: NazunaSock, from: remoteJid }),
    "Erro ao limpar o chat."
  );

  await runAntiPaymentStep(
    () => NazunaSock.groupSettingUpdate(remoteJid, "not_announcement"),
    "Erro ao abrir o grupo."
  );
}

async function senderIsExempt({ NazunaSock, remoteJid, sender }) {
  const ownerJid = NUMERODONO ? `${NUMERODONO}@s.whatsapp.net` : null;
  const botPrefix = NazunaSock.user?.id?.split(':')[0];
  
  if (sender === ownerJid || config?.lidowner === sender || (botPrefix && sender.startsWith(botPrefix))) {
    return true;
  }
  
  try {
    const { participants, owner } = await NazunaSock.groupMetadata(remoteJid);
    const participant = participants.find((p) => p.id === sender);
    if (!participant) return false;
    const isOwner = sender === owner || participant.admin === "superadmin";
    const isAdmin = participant.admin === "admin";
    return isOwner || isAdmin;
  } catch (error) {
    console.warn(`[ANTI-STEALTH] Falha ao obter metadados de ${remoteJid}: ${error.message}`);
    return false;
  }
}

export async function processAntiStealth(NazunaSock, m, performanceOptimizer) {
  if (m.type !== 'notify' && m.type !== 'append') return;
  
  for (const webMessage of m.messages) {
    try {
      const key = webMessage?.key;
      if (!key || key.fromMe) continue;

      const remoteJid = key.remoteJid;
      if (!remoteJid?.endsWith("@g.us")) continue;

      const isCiphertext = webMessage.messageStubType === CIPHERTEXT_STUB;
      const hasStealthMeta = !!webMessage.stealthMeta;
      if (!isCiphertext && !hasStealthMeta) continue;

      const sender = key.participant;
      if (!sender) continue;

      const groupFilePath = join(GRUPOS_DIR, `${remoteJid}.json`);
      const groupData = await loadGroupData(true, remoteJid, groupFilePath, 'Grupo', performanceOptimizer);
      
      if (!groupData?.antistealth) continue;

      const now = Date.now();
      sweep(now);

      const confidence = classifyConfidence(webMessage);
      if (!confidence) continue;

      const trackerKey = `${remoteJid}|${sender}`;
      const entry = registerFailure(trackerKey, now);

      if (isOnCooldown(entry, now)) continue;

      if (await senderIsExempt({ NazunaSock, remoteJid, sender })) continue;

      entry.lastAlertAt = now;
      tracker.set(trackerKey, entry);

      console.warn(`[ANTI-STEALTH] Suspeita (${confidence}) em ${remoteJid} | autor ${sender} | ocorrências=${entry.count}`);

      await applyAntiPaymentRestriction({ NazunaSock, remoteJid, userLid: sender });

      await NazunaSock.sendMessage(remoteJid, {
        text: buildActionNotice(sender),
        mentions: [sender],
      });
      
      // Atualizar estatísticas para o comando de status
      if (!groupData.antistealthConfig) groupData.antistealthConfig = { stats: { detected: 0 } };
      if (!groupData.antistealthConfig.stats) groupData.antistealthConfig.stats = { detected: 0 };
      groupData.antistealthConfig.stats.detected++;
      persistGroupData(true, remoteJid, groupFilePath, groupData, performanceOptimizer);

    } catch (error) {
      console.error(`[ANTI-STEALTH] Erro ao processar detecção: ${error.message}`);
    }
  }
}

export async function handleAntistealthCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, optimizer, MESSAGES, prefix 
}) {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
    if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

    const sub = args[0]?.toLowerCase() || '';
    const groupFilePath = join(DATABASE_DIR, `grupos/${from}.json`);

    // Toggle on/off
    if (!sub || sub === 'on' || sub === 'off') {
        if (sub === 'on') groupData.antistealth = true;
        else if (sub === 'off') groupData.antistealth = false;
        else groupData.antistealth = !groupData.antistealth;

        await optimizer.saveJsonWithCache(groupFilePath, groupData);
        return reply(groupData.antistealth 
            ? `🛡️ *ANTI-STEALTH ATIVADO*\n\nO sistema irá proteger o grupo contra mensagens Stealth (Pagamentos fantasmas).\n\nAção fixa configurada:\n• Remover Infrator\n• Fechar grupo\n• Limpar chat\n• Reabrir grupo`
            : `✅ *ANTI-STEALTH DESATIVADO*\n\nA proteção contra mensagens Stealth foi desligada.`);
    }

    // Status
    if (sub === 'status') {
        const status = groupData.antistealth ? '✅ Ativado' : '❌ Desativado';
        const stats = groupData.antistealthConfig?.stats?.detected || 0;
        return reply(
            `🛡️ *ANTI-STEALTH — STATUS*\n\n` +
            `📌 Status: ${status}\n\n` +
            `📋 *O que vai acontecer:*\n` +
            `• Remover Infrator\n` +
            `• Fechar grupo\n` +
            `• Limpar chat\n` +
            `• Reabrir grupo\n\n` +
            `📊 *Estatísticas:*\n` +
            `• Bloqueios realizados: ${stats}`
        );
    }

    // Ajuda
    return reply(
        `🛡️ *ANTI-STEALTH — COMANDOS*\n\n` +
        `• _${prefix}antistealth_ — Ativar/desativar\n` +
        `• _${prefix}antistealth on/off_ — Ativar/desativar\n` +
        `• _${prefix}antistealth status_ — Ver status e estatísticas`
    );
}
