/*
═════════════════════════════
  Nazuna - Conexão WhatsApp
  Autor: Hiudy
  Revisão: 18/06/2025
═════════════════════════════
*/

const { Boom } = require('@hapi/boom');
const { makeWASocket, useMultiFileAuthState, proto, DisconnectReason } = require('@cognima/walib');
const NodeCache = require('node-cache');
const readline = require('readline');
const pino = require('pino');
const fs = require('fs').promises;
const path = require('path');

const logger = pino({ level: 'silent' });
const AUTH_DIR_PRIMARY = path.join(__dirname, '..', 'database', 'qr-code');
const AUTH_DIR_SECONDARY = path.join(__dirname, '..', 'database', 'qr-code-secondary');
const DATABASE_DIR = path.join(__dirname, '..', 'database', 'grupos');
const msgRetryCounterCache = new NodeCache({ stdTTL: 120, useClones: false });
const { prefixo, nomebot, nomedono, numerodono } = require('./config.json');

const indexModule = require(path.join(__dirname, 'index.js'));

const codeMode = process.argv.includes('--code');
const dualMode = process.argv.includes('--dual');

const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); }));
};

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

let secondarySocket = null;
let useSecondary = false; 

async function createBotSocket(authDir, isPrimary = true) {
  await fs.mkdir(DATABASE_DIR, { recursive: true });
  await fs.mkdir(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const socket = makeWASocket({
    markOnlineOnConnect: false,
    fireInitQueries: false,
    generateHighQualityLinkPreview: false,
    shouldSyncHistoryMessage: () => true,
    connectTimeoutMs: 180000,
    keepAliveIntervalMs: 6000,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 4,
    defaultQueryTimeoutMs: 3000,
    msgRetryCounterCache,
    countryCode: 'BR',
    auth: state,
    printQRInTerminal: !codeMode,
    logger: logger,
    browser: ['Mac OS', 'Safari', '14.4.1'],
    getMessage: async () => proto.Message.fromObject({}),
    cachedGroupMetadata: (jid) => groupCache.get(jid) || null
  });

  socket.ev.on('creds.update', saveCreds);

  if (codeMode && !socket.authState.creds.registered) {
    let phoneNumber = await ask('📞 Digite seu número (com DDD e DDI, ex: +5511999999999): \n\n');
    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(phoneNumber)) {
      console.log('❌ Número inválido! Deve ter entre 10 e 15 dígitos.');
      process.exit(1);
    }
    const code = await socket.requestPairingCode(phoneNumber, 'N4ZUN4V3');
    console.log(`🔢 Seu código de pareamento: ${code}`);
    console.log('📲 No WhatsApp, vá em "Aparelhos Conectados" -> "Conectar com Número de Telefone" e insira o código.\n');
  }

  if (isPrimary) {
    socket.ev.on('groups.update', async ([ev]) => {
      const meta = await socket.groupMetadata(ev.id).catch(() => null);
      if (meta) groupCache.set(ev.id, meta);
    });

    socket.ev.on('group-participants.update', async (inf) => {
      const from = inf.id;
      if (inf.participants[0].startsWith(socket.user.id.split(':')[0])) return;

      let groupMetadata = groupCache.get(from);
      if (!groupMetadata) {
        groupMetadata = await socket.groupMetadata(from).catch(() => null);
        if (!groupMetadata) return;
        groupCache.set(from, groupMetadata);
      }

      const groupFilePath = path.join(DATABASE_DIR, `${from}.json`);
      let jsonGp;
      try {
        jsonGp = JSON.parse(await fs.readFile(groupFilePath, 'utf-8'));
      } catch (e) {
        console.error(`Erro ao carregar JSON do grupo ${from}:`, e);
        return;
      }

      if ((inf.action === 'promote' || inf.action === 'demote') && jsonGp.x9) {
        const action = inf.action === 'promote' ? 'promovido a administrador' : 'rebaixado de administrador';
        const by = inf.author || 'alguém';
        await socket.sendMessage(from, {
          text: `🕵️ *X9 Mode* 🕵️\n\n@${inf.participants[0].split('@')[0]} foi ${action} por @${by.split('@')[0]}!`,
          mentions: [inf.participants[0], by],
        });
      }

      if (inf.action === 'add' && jsonGp.antifake) {
        const participant = inf.participants[0];
        const countryCode = participant.split('@')[0].substring(0, 2);
        if (!['55', '35'].includes(countryCode)) {
          await socket.groupParticipantsUpdate(from, [participant], 'remove');
          await socket.sendMessage(from, {
            text: `🚫 @${participant.split('@')[0]} foi removido por ser de um país não permitido (antifake ativado)!`,
            mentions: [participant],
          });
        }
      }

      if (inf.action === 'add' && jsonGp.antipt) {
        const participant = inf.participants[0];
        const countryCode = participant.split('@')[0].substring(0, 3);
        if (countryCode === '351') {
          await socket.groupParticipantsUpdate(from, [participant], 'remove');
          await socket.sendMessage(from, {
            text: `🚫 @${participant.split('@')[0]} foi removido por ser de Portugal (antipt ativado)!`,
            mentions: [participant],
          });
        }
      }

      if (inf.action === 'add' && jsonGp.blacklist?.[inf.participants[0]]) {
        const sender = inf.participants[0];
        try {
          await socket.groupParticipantsUpdate(from, [sender], 'remove');
          await socket.sendMessage(from, {
            text: `🚫 @${sender.split('@')[0]} foi removido automaticamente por estar na blacklist.\nMotivo: ${jsonGp.blacklist[sender].reason}`,
            mentions: [sender],
          });
        } catch (e) {
          console.error(`Erro ao remover usuário da blacklist no grupo ${from}:`, e);
        }
        return;
      }

      if (inf.action === 'add' && jsonGp.bemvindo) {
        const sender = inf.participants[0];
        const textBv = jsonGp.textbv && jsonGp.textbv.length > 1
          ? jsonGp.textbv
          : 'Seja bem-vindo(a) #numerodele# ao #nomedogp#!\nVocê é nosso membro número: *#membros#*!';

        const welcomeText = textBv
          .replaceAll('#numerodele#', `@${sender.split('@')[0]}`)
          .replaceAll('#nomedogp#', groupMetadata.subject)
          .replaceAll('#desc#', groupMetadata.desc || '')
          .replaceAll('#membros#', groupMetadata.participants.length);

        try {
          const message = { text: welcomeText, mentions: [sender] };
          if (jsonGp.welcome?.image) {
            message.image = { url: jsonGp.welcome.image };
            delete message.text;
            message.caption = welcomeText;
          }
          await socket.sendMessage(from, message);
        } catch (e) {
          console.error(`Erro ao enviar mensagem de boas-vindas no grupo ${from}:`, e);
        }
      }

      if (inf.action === 'remove' && jsonGp.exit?.enabled) {
        const sender = inf.participants[0];
        const exitText = jsonGp.exit.text && jsonGp.exit.text.length > 1
          ? jsonGp.exit.text
          : 'Adeus #numerodele#! 👋\nO grupo *#nomedogp#* agora tem *#membros#* membros.';

        const formattedText = exitText
          .replaceAll('#numerodele#', `@${sender.split('@')[0]}`)
          .replaceAll('#nomedogp#', groupMetadata.subject)
          .replaceAll('#desc#', groupMetadata.desc || '')
          .replaceAll('#membros#', groupMetadata.participants.length);

        try {
          const message = { text: formattedText, mentions: [sender] };
          if (jsonGp.exit?.image) {
            message.image = { url: jsonGp.exit.image };
            message.caption = formattedText;
          }
          await socket.sendMessage(from, message);
        } catch (e) {
          console.error(`Erro ao enviar mensagem de saída no grupo ${from}:`, e);
        }
      }
    });

    socket.ev.on('messages.upsert', async (m) => {
      if (!m.messages || !Array.isArray(m.messages) || m.type !== 'notify') return;
      try {
        if (typeof indexModule === 'function') {
          for (const info of m.messages) {
            if (!info.message || !info.key.remoteJid) continue;
            const activeSocket = dualMode && useSecondary && secondarySocket?.user ? secondarySocket : socket;
            useSecondary = !useSecondary;
            await indexModule(activeSocket, info, null, groupCache);
          }
        } else {
          console.error('O módulo index.js não exporta uma função válida.');
        }
      } catch (err) {
        console.error('Erro ao chamar o módulo index.js:', err);
      }
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === 'open') {
        console.log(
          `============================================\nBot: ${nomebot}\nPrefix: ${prefixo}\nDono: ${nomedono}\nCriador: Hiudy\n============================================\n    ✅ BOT INICIADO COM SUCESSO${dualMode ? ' (MODO DUAL)' : ''}\n============================================`
        );
      }

      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const reasonMessages = {
          [DisconnectReason.loggedOut]: '🗑️ Sessão inválida, excluindo autenticação...',
          401: '🗑️ Sessão inválida, excluindo autenticação...',
          408: '⏰ A sessão sofreu um timeout, recarregando...',
          411: '📄 O arquivo de sessão parece incorreto, tentando recarregar...',
          428: '📡 Não foi possível manter a conexão com o WhatsApp, tentando novamente...',
          440: '🔗 Existem muitas sessões conectadas, feche algumas...',
          500: '⚙️ A sessão parece mal configurada, tentando reconectar...',
          503: '❓ Erro desconhecido, tentando reconectar...',
          515: '🔄 Reiniciando código para estabilizar conexão...',
        };

        if (reason) {
          console.log(`⚠️ Conexão primária fechada, motivo: ${reason} - ${reasonMessages[reason] || 'Motivo desconhecido'}`);
          if ([DisconnectReason.loggedOut, 401].includes(reason)) {
            await fs.rm(AUTH_DIR_PRIMARY, { recursive: true, force: true });
          }
        }

        await socket.end();
        console.log('🔄 Tentando reconectar conexão primária...');
        startNazu();
      }

      if (connection === 'connecting') {
        console.log('🔄 Atualizando sessão primária...');
      }
    });
  } else {
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        console.log('🔀 Conexão secundária estabelecida com sucesso!');
      }

      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log(`🔀 Conexão secundária fechada, motivo: ${reason}`);

        if ([DisconnectReason.loggedOut, 401].includes(reason)) {
          await fs.rm(AUTH_DIR_SECONDARY, { recursive: true, force: true });
        }

        setTimeout(async () => {
          try {
            console.log('🔀 Tentando reconectar conexão secundária...');
            secondarySocket = await createBotSocket(AUTH_DIR_SECONDARY, false);
          } catch(e) {
            console.error('🔀 Falha ao reconectar conexão secundária:', e);
          }
        }, 5000);
      }

      if (connection === 'connecting') {
        console.log('🔀 Conectando sessão secundária...');
      }
    });
  }

  return socket;
};


async function startNazu() {
  try {
    console.log(`🚀 Iniciando Nazuna ${dualMode ? '(Modo Dual)' : '(Modo Simples)'}...`);

    const primarySocket = await createBotSocket(AUTH_DIR_PRIMARY, true);

    if (dualMode) {
      console.log('🔀 Modo Dual ativado - Iniciando conexão secundária...');
      try {
        secondarySocket = await createBotSocket(AUTH_DIR_SECONDARY, false);

        const waitForConnection = (socket) => {
          return new Promise((resolve) => {
            if (socket.user) {
              resolve();
            } else {
              socket.ev.on('connection.update', (update) => {
                if (update.connection === 'open') resolve();
              });
            }
          });
        };

        await Promise.all([
          waitForConnection(primarySocket),
          waitForConnection(secondarySocket)
        ]);

        console.log('🔀 Ambas as conexões estabelecidas - Modo dual pronto!');
      } catch (err) {
        console.error('🔀 Erro ao iniciar conexão secundária:', err);
        console.log('🔀 Continuando apenas com conexão primária...');
      }
    }

  } catch (err) {
    console.error('Erro ao iniciar o bot:', err);
    process.exit(1);
  };
};


startNazu();