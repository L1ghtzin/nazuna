// ==================== CONTEXT BUILDER ====================
// Centraliza: imports, parsing de mensagem, permissões, cache, reply/reagir.
// Exporta buildMessageContext() que retorna o objeto ctx completo.

import { downloadContentFromMessage, generateWAMessageFromContent, generateWAMessage, getContentType } from 'baileys';
import menus from '../views/index.js';
import modulesExport from '../funcs/exports.js';

let modoLiteFileChecked = false;
import axios from 'axios';
import pathz from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { groupCache } from './groupCache.js';
import { MESSAGES } from './messages.js';
import { writeAsync, readAsync, exists } from './database/io.js';
import { Commands, getTotalCommands, getTopSimilarCommands, getCommandListCached } from './commandSearch.js';
import { MASS_MENTION_THRESHOLD, checkMassMentionLimit, registerMassMentionUse, loadMassMentionConfig, saveMassMentionConfig, loadMassMentionLimit, MASS_MENTION_MAX_USES } from './massMentionGuard.js';

import { ROLE_GOING_BASE, ROLE_NOT_GOING_BASE, isGoingEmoji, isNotGoingEmoji, ensureRoleParticipants, refreshRoleAnnouncement } from './roleManager.js';
import { processReactionMessage } from '../middleware/reactionHandler.js';
import { processGroupSecurity } from '../middleware/groupSecurityHandler.js';
import { processAutomation } from '../middleware/automationHandler.js';
import { processStats } from '../middleware/statsHandler.js';

import * as vipCommandsManager from './vipCommandsManager.js';
import { getInfo as gdriveGetInfo } from '../funcs/utils/gdrive.js';
import { getInfo as mediafireGetInfo } from '../funcs/utils/mediafire.js';
import { getInfo as twitterGetInfo } from '../funcs/utils/twitter.js';
import { search, searchNews } from '../funcs/utils/search.js';
import { removeBg, upscale } from '../funcs/utils/imagetools.js';
import spotifyModule from '../funcs/downloads/spotify.js';
import captchaIndex, { initCaptchaIndex, addCaptcha, removeCaptcha, getCaptcha, hasPendingCaptcha } from './captchaIndex.js';
import fsPromises from 'fs/promises';
import { hasGroupStatusMessage } from './securityHelpers.js';

import {
  formatUptime,
  normalizar,
  isGroupId,
  isUserId,
  isValidLid,
  isValidJid,
  getUserName,
  getLidFromJid,
  getJidFromLid,
  addJidLidToCache,
  buildUserId,
  getBotId,
  ensureDirectoryExists,
  ensureJsonFileExists,
  loadJsonFile,
  initJidLidCache,
  saveJidLidCache,
  getLidFromJidCached,
  normalizeUserId,
  convertIdsToLid,
  idsMatch,
  idInArray,
  formatAIResponse
} from './helpers.js';

import {
  loadMsgPrefix,
  saveMsgPrefix,
  loadMsgBotOn,
  saveMsgBotOn,
  loadCmdNotFoundConfig,
  saveCmdNotFoundConfig,
  validateMessageTemplate,
  formatMessageWithFallback,
  loadCustomReacts,
  saveCustomReacts,
  loadReminders,
  saveReminders,
  addCustomReact,
  deleteCustomReact,
  loadDivulgacao,
  saveDivulgacao,
  loadDonoDivulgacao,
  saveDonoDivulgacao,
  loadSubdonos,
  saveSubdonos,
  isSubdono,
  addSubdono,
  removeSubdono,
  getSubdonos,
  loadRentalData,
  saveRentalData,
  isRentalModeActive,
  setRentalMode,
  getGroupRentalStatus,
  setGroupRental,
  loadActivationCodes,
  saveActivationCodes,
  generateActivationCode,
  validateActivationCode,
  useActivationCode,
  extendGroupRental,
  isModoLiteActive,
  loadParceriasData,
  saveParceriasData,
  calculateNextLevelXp,
  getPatent,
  loadEconomy,
  saveEconomy,
  getEcoUser,
  parseAmount,
  fmt,
  timeLeft,
  applyShopBonuses,
  PICKAXE_TIER_MULT,
  PICKAXE_TIER_ORDER,
  SHOP_ITEMS,
  getActivePickaxe,
  ensureEconomyDefaults,
  giveMaterial,
  generateDailyChallenge,
  ensureUserChallenge,
  updateChallenge,
  isChallengeCompleted,
  updateQuestProgress,
  checkEcoLevelUp,
  diagnosticDatabase,
  SKILL_LIST,
  ensureUserSkills,
  skillXpForNext,
  addSkillXP,
  getSkillBonus,
  endOfWeekTimestamp,
  endOfMonthTimestamp,
  generateWeeklyChallenge,
  generateMonthlyChallenge,
  ensureUserPeriodChallenges,
  updatePeriodChallenge,
  isPeriodCompleted,
  checkLevelUp,
  checkLevelDown,
  loadCustomAutoResponses,
  saveCustomAutoResponses,
  loadGroupAutoResponses,
  saveGroupAutoResponses,
  addAutoResponse,
  deleteAutoResponse,
  processAutoResponse,
  sendAutoResponse,
  loadCustomCommands,
  saveCustomCommands,
  removeCustomCommand,
  findCustomCommand,
  loadNoPrefixCommands,
  saveNoPrefixCommands,
  loadCommandAliases,
  saveCommandAliases,
  addAlias,
  removeAlias,
  listAliases,
  addNoPrefix,
  removeNoPrefix,
  listNoPrefix,
  loadGlobalBlacklist,
  saveGlobalBlacklist,
  addGlobalBlacklist,
  removeGlobalBlacklist,
  getGlobalBlacklist,
  loadMenuDesign,
  saveMenuDesign,
  getMenuDesignWithDefaults,
  setSupportMode,
  findSupportTicketById,
  createSupportTicket,
  acceptSupportTicket,
  listSupportTickets,
  loadCommandLimits,
  saveCommandLimits,
  addCommandLimit,
  removeCommandLimit,
  getCommandLimits,
  checkCommandLimit,
  formatTimeLeft,
  runDatabaseSelfTest,
  // Funções de segurança
  loadJsonFileSafe,
  saveJsonFileSafe,
  loadLevelingSafe,
  saveLevelingSafe,
  getLevelingUser,
  validateLevelingUser,
  validateEconomyUser,
  // Funções de normalização de parâmetros
  normalizeParam,
  compareParams,
  findKeyIgnoringAccents,
  matchParam,
  resolveParamAlias,
  // Sistema de Personalização de Grupo
  loadGroupCustomization,
  isGroupCustomizationEnabled,
  setGroupCustomizationEnabled,
  getGroupCustomization,
  setGroupCustomName,
  setGroupCustomPhoto,
  removeGroupCustomName,
  removeGroupCustomPhoto,
  // Sistema de Áudio do Menu
  loadMenuAudio,
  isMenuAudioEnabled,
  getMenuAudioPath,
  setMenuAudio,
  removeMenuAudio,
  // Sistema de Ler Mais do Menu
  isMenuLerMaisEnabled,
  setMenuLerMais,
  getMenuLerMaisText,
  writeJsonFile
} from './database.js';

import { execDynamicCommand, getAllCommandList } from './dynamicCommand.js';
import { parseCustomCommandMeta, buildUsageFromParams, parseArgsFromString, escapeRegExp, validateParamValue } from './helpers.js';
import {
  PACKAGE_JSON_PATH,
  CONFIG_FILE,
  DATABASE_DIR,
  GRUPOS_DIR,
  USERS_DIR,
  DONO_DIR,
  PARCERIAS_DIR,
  TMP_DIR,
  LEVELING_FILE,
  CUSTOM_AUTORESPONSES_FILE,
  DIVULGACAO_FILE,
  NO_PREFIX_COMMANDS_FILE,
  COMMAND_ALIASES_FILE,
  GLOBAL_BLACKLIST_FILE,
  MENU_DESIGN_FILE,
  ECONOMY_FILE,
  MSGPREFIX_FILE,
  CUSTOM_REACTS_FILE,
  REMINDERS_FILE,
  CMD_NOT_FOUND_FILE,
  ANTIFLOOD_FILE,
  ANTIPV_FILE,
  GLOBAL_BLOCKS_FILE,
  CMD_LIMIT_FILE,
  CMD_USER_LIMITS_FILE,
  ANTISPAM_FILE,
  BOT_STATE_FILE,
  AUTO_HORARIOS_FILE,
  AUTO_MENSAGENS_FILE,
  MODO_LITE_FILE,
  JID_LID_CACHE_FILE
} from './paths.js';

import { handleCaptchaResponse } from '../middleware/captchaHandler.js';
import { handleAntiPV } from '../middleware/antiPV.js';
import { handleJoinRequest } from '../middleware/joinRequestHandler.js';
import { handleAutoDownload } from '../handlers/autoDownload.js';
import { loadGroupData, persistGroupData, isUserWhitelisted as isUserWhitelistedCore, isUserInMap, removeUserFromMap } from './groupManager.js';
import { getMessageText, extractParticipantId, extractReason, normalizeClanName, normalizeCommand, getBotNumber, getFileBuffer, getMediaInfo, processImageForProfile, unwrapMessage } from './messageHelpers.js';
import * as timeHelpers from './timeHelpers.js';

const __ctxFilename = fileURLToPath(import.meta.url);
const __dirname = pathz.dirname(__ctxFilename);
const OWNER_ONLY_MESSAGE = '🚫 Este comando é apenas para o dono do bot!';
const buildGroupFilePath = (groupId) => pathz.join(GRUPOS_DIR, `${groupId}.json`);

/**
 * Constrói o contexto completo para processamento de uma mensagem.
 * @returns {object|null} ctx - Objeto com todas as variáveis necessárias, ou null se mensagem inválida.
 */
export async function buildMessageContext(bot, info, store, messagesCache, rentalExpirationManager, topLevel) {
  const { ensureDatabaseIntegrity, botVersion, __dirname: indexDir } = topLevel;

  // Log de início de processamento para debug paralelo
  const msgId = info?.key?.id?.slice(-6) || 'unknown';
  const from = info?.key?.remoteJid || 'unknown';

  const config = loadJsonFile(CONFIG_FILE, {});

  // Verificação e correção do prefixo reservado $ ao inicializar
  if (config.prefixo === '$') {
    config.prefixo = '/';
    writeJsonFile(CONFIG_FILE, config);

    // Notifica o dono sobre a mudança automática
    const ownerJid = `${config.numerodono}@s.whatsapp.net`;
    try {
      await bot.sendMessage(ownerJid, {
        text: MESSAGES.general.autoPrefixFixed(config.prefixo)
      });
    } catch (notifyError) {
      console.log('Aviso: Não foi possível notificar o dono sobre a mudança de prefixo:', notifyError.message);
    }
  }

  // Log de debug aprimorado para rastreamento de IDs
  const debugLog = (msg, data = null) => {
    if (config?.debug) {
      console.log(`[DEBUG] ${msg}`, data || '');
    }
  };

  const normalizeMessageTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') {
      const parsed = Number(timestamp);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof timestamp === 'object') {
      if (typeof timestamp.toNumber === 'function') return timestamp.toNumber();
      if (typeof timestamp.low === 'number') return timestamp.low;
    }
    return null;
  };

  const getLastMessageInChat = (jid) => {
    if (!messagesCache || messagesCache.size === 0) return null;

    let lastMsg = null;
    let lastTimestamp = 0;

    for (const cachedMsg of messagesCache.values()) {
      if (!cachedMsg?.key?.remoteJid || cachedMsg.key.remoteJid !== jid) continue;
      const ts = normalizeMessageTimestamp(cachedMsg.messageTimestamp);
      if (!ts) continue;

      if (!lastMsg || ts > lastTimestamp) {
        lastMsg = cachedMsg;
        lastTimestamp = ts;
      }
    }

    if (!lastMsg?.key || !lastTimestamp) return null;
    return {
      key: lastMsg.key,
      messageTimestamp: lastTimestamp
    };
  };

  const deleteChatByLastMessage = async (jid) => {
    if (!bot?.chatModify) return false;

    const lastMsgInChat = getLastMessageInChat(jid);
    if (lastMsgInChat?.key && lastMsgInChat?.messageTimestamp) {
      await bot.chatModify({
        delete: true,
        lastMessages: [
          {
            key: lastMsgInChat.key,
            messageTimestamp: lastMsgInChat.messageTimestamp
          }
        ]
      }, jid);
      return true;
    }

    await bot.chatModify({ delete: true }, jid);
    return true;
  };

  const clearChatHistorySafe = async (jid) => {
    if (!bot?.chatModify) return false;
    try {
      await bot.chatModify({ clear: 'all' }, jid);
      return true;
    } catch (e) {
      if (typeof e?.message === 'string' && e.message.toLowerCase().includes('not supported')) {
        await deleteChatByLastMessage(jid);
        return true;
      }
      throw e;
    }
  };

  async function getCachedGroupMetadata(groupId) {
    try {
      return await groupCache.ensure(groupId, bot);
    } catch (error) {
      return await bot.groupMetadata(groupId).catch(() => ({}));
    }
  }

  const numerodono = config.numerodono;
  const nomedono = config.nomedono;
  const nomebot = config.nomebot;
  const prefixo = config.prefixo;
  const debug = config.debug;
  const lidowner = config.lidowner;



  // handleAutoDownload importado de handlers/autoDownload.js
  const {
    menu, menudown, menuadm, menubn, menuDono, menuMembros,
    menuFerramentas, menuSticker, menuAlterador,
    menuTopCmd, menuRPG, menuVIP, menuBuscas, menuBrawlStars
  } = menus;
  const prefix = prefixo;
  const numerodonoStr = String(numerodono);

  const {
    youtube, tiktok, pinterest, igdl, kwai, sendSticker, Dicionary, styleText,
    emojiMix, upload, mcPlugin, tictactoe, toolsJson, vabJson,
    Lyrics, commandStats, VerifyUpdate, relationshipManager,
    spotify, soundcloud, facebook, twitter, gdrive, mediafire, search, imagetools, freefire,
    // Novos módulos
    connect4, uno, memoria, achievements, gifts, reputation, qrcode, notes,
    calculator, audioEdit, antitoxic, antipalavra, antistickerplus, transmissao
  } = modulesExport;
  // Otimização: Cache de dados estáticos com TTL

  const modoLiteFile = DATABASE_DIR + '/modolite.json';

  const antipvData = loadJsonFile(DATABASE_DIR + '/antipv.json', {});
  const premiumListaZinha = loadJsonFile(DONO_DIR + '/premium.json', {});
  const antifloodData = loadJsonFile(DATABASE_DIR + '/antiflood.json', {});
  const antiSpamGlobal = loadJsonFile(DATABASE_DIR + '/antispam.json', { enabled: false, limit: 5, interval: 10, blockTime: 600, users: {}, blocks: {} });
  const globalBlocks = loadJsonFile(DATABASE_DIR + '/globalBlocks.json', { commands: {}, users: {} });
  const botState = loadJsonFile(DATABASE_DIR + '/botState.json', { status: 'on' });
  const modoLiteGlobal = loadJsonFile(modoLiteFile, { status: false });
  if (!modoLiteFileChecked) {
    if (!fs.existsSync(modoLiteFile)) {
      writeJsonFile(modoLiteFile, modoLiteGlobal);
    }
    modoLiteFileChecked = true;
  }

  if (typeof global.autoStickerMode === 'undefined') {
    global.autoStickerMode = 'default';
  }
  try {
    let from = info.key.remoteJid;
    const isGroup = from?.endsWith('@g.us') || false;


    if (!info.key.participant && !info.key.remoteJid) return;
    let sender;
    if (isGroup) {
      // Prioriza participant, depois busca por LID, com fallback para JID
      sender = info.key.participant || info.message?.participant;

      if (!sender) {
        const participants = Object.keys(info.key).filter(k => k.startsWith("participant")).map(k => info.key[k]).filter(Boolean);
        if (participants.length) {
          sender = participants.find(p => p.includes("@lid")) || participants.find(p => p.includes("@s.whatsapp.net")) || participants[0];
        }
      }

      // Se ainda não encontrou, tenta extrair do contextInfo
      if (!sender && info.message?.extendedTextMessage?.contextInfo?.participant) {
        sender = info.message.extendedTextMessage.contextInfo.participant;
      }

      // Se for JID, converte para LID usando cache
      if (sender && isValidJid(sender)) {
        sender = await getLidFromJidCached(bot, sender);
      }
    } else {
      sender = info.key.remoteJid;

      // Se for JID no PV, converte para LID usando cache
      if (sender && isValidJid(sender)) {
        sender = await getLidFromJidCached(bot, sender);
      }
    }

    // Debug: log do sender identificado
    debugLog('Sender identificado:', { sender, isGroup, from: from?.substring(0, 20) });

    // Se sender ainda for undefined, ignora a mensagem (ex: mensagens de sistema, stubs, etc)
    if (!sender) {
      debugLog('Sender não identificado, ignorando mensagem');
      return;
    }

    const pushname = info.pushName || '';
    const isStatus = from?.endsWith('@broadcast') || false;
    const nmrdn = buildUserId(numerodono, config);
    const subDonoList = loadSubdonos();
    const isSubOwner = isSubdono(sender);
    const ownerJid = `${numerodono}@s.whatsapp.net`;
    const botId = getBotId(bot);
    const isBotSender = sender === botId || sender === bot.user?.id?.split(':')[0] + '@s.whatsapp.net' || sender === bot.user?.id?.split(':')[0] + '@lid';

    const senderBase = sender.split('@')[0];
    const ownerBase = String(numerodono);
    const lidOwnerBase = lidowner ? lidowner.split('@')[0] : null;

    const isRealOwner = senderBase === ownerBase ||
      sender === nmrdn ||
      sender === ownerJid ||
      (lidowner && sender === lidowner) ||
      (lidOwnerBase && senderBase === lidOwnerBase);

    const isOwner = isRealOwner || info.key.fromMe || isBotSender || isSubOwner;

    const isOwnerOrSub = isOwner;


    const type = getContentType(info.message);

    // ==================== PROCESSAMENTO DE SOLICITAÇÕES DE ENTRADA NO GRUPO ====================
    const joinRequestHandled = await handleJoinRequest(bot, info, from, isGroup, GRUPOS_DIR, debug);
    if (joinRequestHandled) return;
    // ==================== FIM: PROCESSAMENTO DE SOLICITAÇÕES ====================

    const isMedia = ["imageMessage", "videoMessage", "audioMessage"].includes(type);
    const isImage = type === 'imageMessage';
    const isVideo = type === 'videoMessage';
    const isAudio = type === 'audioMessage';
    const isVisuU2 = type === 'viewOnceMessageV2';
    const isVisuU = type === 'viewOnceMessage';
    const isButtonMessage = info.message.interactiveMessage || info.message.templateButtonReplyMessage || info.message.buttonsMessage || info.message.interactiveResponseMessage || info.message.listResponseMessage || info.message.buttonsResponseMessage ? true : false;
    const msgString = info.message ? JSON.stringify(info.message) : '';
    const isStatusMention = info.message ? hasGroupStatusMessage(info.message) : false;
    const body = getMessageText(info.message) || info?.text || '';

    let args = body.trim().split(/ +/).slice(1);
    let q = args.join(' ');
    const budy2 = normalizar(body);
    
    // Extrai a mensagem real ignorando wrappers como ephemeralMessage
    const actualMessage = unwrapMessage(info.message);
    
    const menc_prt = actualMessage?.extendedTextMessage?.contextInfo?.participant;
    const menc_jid2 = actualMessage?.extendedTextMessage?.contextInfo?.mentionedJid;
    const menc_os2 = (menc_jid2 && menc_jid2.length > 0) ? menc_jid2[0] : menc_prt;
    const sender_ou_n = (menc_jid2 && menc_jid2.length > 0) ? menc_jid2[0] : menc_prt || sender;
    const groupFile = buildGroupFilePath(from);
    const groupMetadata = isGroup ? await getCachedGroupMetadata(from) : {};
    
    // Popula o cache JID-LID com todos os membros do grupo para otimização de menções
    if (isGroup && groupMetadata.participants) {
      for (const participant of groupMetadata.participants) {
        if (participant.id && participant.lid) {
          addJidLidToCache(participant.id, participant.lid);
        }
      }
    }

    const groupName = groupMetadata?.subject || '';
    const groupData = await loadGroupData(isGroup, from, groupFile, groupName);

    // Otimização: Cache de parcerias
    let parceriasData = {};
    if (isGroup) {
      parceriasData = loadParceriasData(from);
    }

    // Wrappers para usar groupData no escopo atual
    const persistGroupDataLocal = () => persistGroupData(isGroup, from, groupFile, groupData);
    const isUserWhitelisted = (userId, antiType) => isUserWhitelistedCore(groupData, userId, antiType);

    const groupPrefix = groupData.customPrefix || prefixo;

    const isCmd = body.trim().startsWith(groupPrefix);

    // Suporte para "! comando" (com espaço após o prefixo)
    const bodyWithoutPrefix = body.trim().slice(groupPrefix.length).trimStart();

    const aliases = loadCommandAliases();
    const matchedAlias = aliases.find(item => normalizar(bodyWithoutPrefix.split(/ +/).shift().trim()) === item.alias);

    // Se encontrou um alias, aplicar parâmetros fixos
    if (matchedAlias && matchedAlias.fixedParams) {
      const userArgs = bodyWithoutPrefix.split(/ +/).slice(1).join(' ');
      const combinedParams = matchedAlias.fixedParams + (userArgs ? ' ' + userArgs : '');
      q = combinedParams;
      args.length = 0;
      args.push(...combinedParams.split(/ +/));
    }

    const command = isCmd ? matchedAlias ? matchedAlias.command : normalizar(bodyWithoutPrefix.split(/ +/).shift().trim()).replace(/\s+/g, '') : null;

    // Recalcular args usando bodyWithoutPrefix para suportar "! comando" (com espaço)
    if (isCmd && !matchedAlias) {
      const newArgs = bodyWithoutPrefix.split(/ +/).slice(1);
      args.length = 0;
      args.push(...newArgs);
      q = newArgs.join(' ');
    }

    const isPremium = premiumListaZinha[sender] || premiumListaZinha[from] || isOwner;

    async function reply(text, options = {}) {
      try {
        const {
          mentions = [],
          noForward = false,
          noQuote = false
        } = options;
        const messageContent = {
          text: text.trim(),
          mentions: mentions
        };
        const sendOptions = {
          // sendEphemeral: true
        };
        if (!noForward) {
          sendOptions.contextInfo = {
            forwardingScore: 50,
            isForwarded: true,
            externalAdReply: {
              showAdAttribution: true
            }
          };
        }
        if (!noQuote) {
          // Copia o info para não mutar o objeto original
          const quotedMessage = { ...info };
          quotedMessage.key = { ...info.key, remoteJid: from };
          sendOptions.quoted = quotedMessage;
        }
        const result = await bot.sendMessage(from, messageContent, sendOptions);
        return result;
      } catch (error) {
        return null;
      }
    }
    // bot.reply fica apenas no ctx — não mutar o socket para evitar race conditions

    const reagir = async (emj, options = {}) => {
      try {
        const messageKey = options.key || info.key;
        const delay = options.delay || 500;
        if (!messageKey) {
          console.error("Chave de mensagem inválida para reação");
          return false;
        }
        if (typeof emj === 'string') {
          if (emj.length < 1 || emj.length > 5) {
            console.warn("Emoji inválido para reação:", emj);
            return false;
          }
          await bot.sendMessage(from, {
            react: {
              text: emj,
              key: messageKey
            }
          });
          return true;
        } else if (Array.isArray(emj) && emj.length > 0) {
          for (const emoji of emj) {
            if (typeof emoji !== 'string' || emoji.length < 1 || emoji.length > 5) {
              console.warn("Emoji inválido na sequência:", emoji);
              continue;
            }
            await bot.sendMessage(from, {
              react: {
                text: emoji,
                key: messageKey
              }
            });
            if (delay > 0 && emj.indexOf(emoji) < emj.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erro ao reagir com emoji:", error);
        return false;
      }
    };

    const botForContext = new Proxy(bot, {
      get(target, prop, receiver) {
        if (prop === 'react') return reagir;
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, prop, value, receiver) {
        if (prop === 'react') return true;
        return Reflect.set(target, prop, value, receiver);
      }
    });

    // Verificação de captcha para solicitações de entrada em grupos (DEVE vir ANTES de antipv)
    const captchaHandled = await handleCaptchaResponse(bot, sender, body, isGroup, info, reply, GRUPOS_DIR, debug);
    if (captchaHandled) return;

    // Proteo Anti-PV
    const pvBlocked = await handleAntiPV(bot, sender, command, isGroup, isCmd, isOwner, isPremium, antipvData, reply);
    if (pvBlocked) {
      return;
    }
    if (isGroup && groupData.botBan?.ativo && !isOwner && !isPremium) {
      return;
    };

    // Extrai IDs dos membros (pode estar em JID)
    const rawMembers = !isGroup ? [] :
      groupMetadata.participants?.map(extractParticipantId).filter(Boolean) || [];

    // Extrai IDs dos admins (pode estar em JID)
    const rawAdmins = !isGroup ? [] :
      groupMetadata.participants?.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(extractParticipantId).filter(Boolean) || [];

    // Converte todos os membros e admins para LID (usando cache)
    const AllgroupMembers = await convertIdsToLid(bot, rawMembers);
    const groupAdmins = await convertIdsToLid(bot, rawAdmins);

    // Debug log
    debugLog('Membros e Admins convertidos:', {
      totalMembros: AllgroupMembers.length,
      totalAdmins: groupAdmins.length,
      admins: groupAdmins.map(a => a?.substring(0, 20))
    });

    const botNumber = getBotNumber(bot);

    // Converte o botNumber para LID se for JID
    const botNumberLid = botNumber && isValidJid(botNumber)
      ? await getLidFromJidCached(bot, botNumber)
      : botNumber;

    const isBotAdmin = !isGroup || !botNumberLid ? false : idInArray(botNumberLid, groupAdmins);

    let isGroupAdmin = false;
    if (isGroup) {
      const isModeratorActionAllowed = groupData.moderators?.includes(sender) && groupData.allowedModCommands?.includes(command);

      // Usa a função idsMatch para comparação robusta
      const isAdminMatch = idInArray(sender, groupAdmins);

      isGroupAdmin = isAdminMatch || isOwner || isModeratorActionAllowed;

      // Debug: log das verificações de admin
      debugLog('Verificação de admin:', {
        sender: sender?.substring(0, 30),
        senderBase: sender?.split('@')[0],
        groupAdminsCount: groupAdmins.length,
        groupAdmins: groupAdmins.map(a => a?.substring(0, 20)),
        isAdminMatch,
        isGroupAdmin,
        isModerator: isModeratorActionAllowed,
        isBotAdmin,
        botNumber: botNumberLid?.substring(0, 30)
      });
    }
    const isModoBn = groupData.modobrincadeira;
    const isOnlyAdmin = groupData.soadm;
    const soadmBypassCommands = ['suporte', 'ticketsuporte', 'suporteticket', 'ticket'];

    // Se modo soadm ativo e não é admin, ignorar aliases silenciosamente
    if (isGroup && isOnlyAdmin && !isGroupAdmin && !isOwner && matchedAlias) {
      return; // Ignora silenciosamente o alias para não-admins
    }


    const isMuted = isUserInMap(groupData.mutedUsers, sender);
    const isMuted2 = isUserInMap(groupData.mutedUsers2, sender);
    const isAntiLinkGp = groupData.antilinkgp;
    const isAntiLinkCanal = groupData.antilinkcanal;
    const isAntiLinkSoft = groupData.antilinksoft;
    const isAntiDel = groupData.antidel;
    const isAntiBtn = groupData.antibtn;
    const isAntiStatus = groupData.antistatus;
    const isAutoRepo = groupData.autorepo;
    const isAssistente = groupData.assistente;
    const isModoLite = isGroup && isModoLiteActive(groupData, modoLiteGlobal);

    if (type === 'reactionMessage') {
      await processReactionMessage(bot, info, isGroup, sender, groupData, groupPrefix, from, persistGroupDataLocal);
      return;
    }

    const securityResult = await processGroupSecurity({
      bot, info, isGroup, sender, groupData, command, isCmd, isImage, isVideo,
      isVisuU, isVisuU2, isBotAdmin, isGroupAdmin, isOwner, isStatusMention, isButtonMessage,
      from, pushname, reply, messagesCache, type, body, isOwnerOrSub, antiSpamGlobal, writeJsonFile,
      DATABASE_DIR, groupFile, getUserName, isUserWhitelisted, getGroupRentalStatus,
      isRentalModeActive, validateActivationCode, useActivationCode, isMuted, isMuted2, MESSAGES,
      idInArray, groupAdmins, botNumberLid
    });
    if (securityResult?.stopProcessing) {
      return;
    }
    // Stats em fire-and-forget: não bloqueia o pipeline do comando
    processStats({
      bot, info, isGroup, sender, groupData, isCmd, type, pushname,
      writeJsonFile, groupFile, from
    }).catch(e => console.error('❌ Erro no processStats:', e.message));





    const automationResult = await processAutomation({
      bot, info, isGroup, sender, groupData, type, budy2, body, isCmd, isGroupAdmin, isBotAdmin,
      from, getUserName, isUserWhitelisted, reply, getMediaInfo, getFileBuffer, upload,
      handleAutoDownload, youtube, tiktok, igdl, kwai, facebook, pinterest, spotify, soundcloud,
      sendSticker, pushname, nomebot, nomedono, antifloodData
    });
    if (automationResult?.stopProcessing) return;
    let quotedMessageContent = null;
    if (type === 'extendedTextMessage' && actualMessage?.extendedTextMessage?.contextInfo?.quotedMessage) {
      quotedMessageContent = actualMessage.extendedTextMessage.contextInfo.quotedMessage;
    }
    const isQuotedMsg = !!quotedMessageContent?.conversation;
    const isQuotedMsg2 = !!quotedMessageContent?.extendedTextMessage?.text;
    const isQuotedImage = !!quotedMessageContent?.imageMessage;
    const isQuotedVisuU = !!quotedMessageContent?.viewOnceMessage;
    const isQuotedVisuU2 = !!quotedMessageContent?.viewOnceMessageV2;
    const isQuotedVideo = !!quotedMessageContent?.videoMessage;
    const isQuotedDocument = !!quotedMessageContent?.documentMessage;
    const isQuotedDocW = !!quotedMessageContent?.documentWithCaptionMessage;
    const isQuotedAudio = !!quotedMessageContent?.audioMessage;
    const isQuotedSticker = !!quotedMessageContent?.stickerMessage;
    const isQuotedContact = !!quotedMessageContent?.contactMessage;
    const isQuotedLocation = !!quotedMessageContent?.locationMessage;
    const isQuotedProduct = !!quotedMessageContent?.productMessage;

    // Retorna o objeto de contexto completo
    return {
      // Core
      bot: botForContext, info, store, messagesCache, rentalExpirationManager,
      from, isGroup, sender, pushname, type, body, budy2, args, q,
      // Permissões
      isOwner, isRealOwner, isOwnerOrSub, isSubOwner, isGroupAdmin, isBotAdmin, isPremium, isBotSender,
      // Config
      config, prefix, prefixo, groupPrefix, numerodono, nomedono, nomebot, lidowner, debug,
      nmrdn, ownerJid, botNumber, botNumberLid, botId, botVersion,
      // Grupo
      groupData, groupFile, groupName, groupMetadata, groupAdmins, AllgroupMembers,
      parceriasData, isOnlyAdmin, isModoBn, isModoLite,
      // Flags de mídia
      isMedia, isImage, isVideo, isAudio, isVisuU, isVisuU2, isButtonMessage, isStatusMention,
      isQuotedMsg, isQuotedMsg2, isQuotedImage, isQuotedVisuU, isQuotedVisuU2,
      isQuotedVideo, isQuotedDocument, isQuotedDocW, isQuotedAudio, isQuotedSticker,
      isQuotedContact, isQuotedLocation, isQuotedProduct, quotedMessageContent,
      // Flags de proteção
      isAntiLinkGp, isAntiLinkCanal, isAntiLinkSoft,
      isAntiDel, isAntiBtn, isAntiStatus, isAutoRepo, isAssistente,
      isMuted, isMuted2,
      // Funções
      reply, reagir, debugLog, persistGroupDataLocal, persistGroupData: persistGroupDataLocal, isUserWhitelisted,
      getCachedGroupMetadata, deleteChatByLastMessage, clearChatHistorySafe,
      // Módulos
      menus, modules: modulesExport,
      youtube, tiktok, pinterest, igdl, kwai, sendSticker, Dicionary, styleText,
      emojiMix, upload, mcPlugin, tictactoe, toolsJson, vabJson,
      Lyrics, commandStats, VerifyUpdate, relationshipManager,
      spotify, soundcloud, facebook, twitter, gdrive, mediafire, freefire,
      connect4, uno, memoria, achievements, gifts, reputation, qrcode, notes,
      calculator, audioEdit, antitoxic, antipalavra, antistickerplus, transmissao,
      // Dados de cache
      antipvData, premiumListaZinha, antifloodData, antiSpamGlobal,
      globalBlocks, botState, modoLiteGlobal,
      // Variáveis de mensagem
      isCmd, command, menc_prt, menc_jid2, menc_os2, mentioned: menc_os2, sender_ou_n, msgString,
      matchedAlias,
      // Handlers
      handleAutoDownload, getFileBuffer, getMediaInfo, processImageForProfile,
      // Utilitários (re-export para ctx)
      writeJsonFile, getUserName, extractReason, normalizeCommand, normalizar, fs, pathz,
      buildGroupFilePath, OWNER_ONLY_MESSAGE, MESSAGES,
      DATABASE_DIR, GRUPOS_DIR, USERS_DIR, DONO_DIR, PARCERIAS_DIR, TMP_DIR,
      CONFIG_FILE, ECONOMY_FILE, LEVELING_FILE,
      // Database functions
      loadLevelingSafe, saveLevelingSafe, getLevelingUser, validateLevelingUser, calculateNextLevelXp,
      loadEconomy, saveEconomy, getEcoUser, parseAmount, fmt, timeLeft, checkEcoLevelUp, updateQuestProgress,
      loadReminders, saveReminders, formatUptime, getTotalCommands,
      loadRentalData, saveRentalData, setGroupRental, extendGroupRental,
      setRentalMode, generateActivationCode, loadActivationCodes, saveActivationCodes,
      addAutoResponse, loadCustomAutoResponses, saveCustomAutoResponses,
      loadGroupAutoResponses, saveGroupAutoResponses,
      loadCustomCommands, saveCustomCommands, removeCustomCommand, findCustomCommand,
      addAlias, listAliases, removeAlias,
      addNoPrefix, removeNoPrefix, listNoPrefix,
      addSubdono, removeSubdono, getSubdonos, isSubdono,
      addGlobalBlacklist, removeGlobalBlacklist, getGlobalBlacklist,
      loadGlobalBlacklist, loadNoPrefixCommands, loadCommandAliases,
      parseCustomCommandMeta, buildUsageFromParams, normalizeUserId, removeUserFromMap,
      isValidJid, isValidLid, buildUserId, getLidFromJidCached, convertIdsToLid, idsMatch, idInArray,
      setSupportMode, createSupportTicket, acceptSupportTicket, findSupportTicketById, listSupportTickets,
      loadMassMentionConfig, saveMassMentionConfig, MASS_MENTION_MAX_USES, MASS_MENTION_THRESHOLD, loadMassMentionLimit, registerMassMentionUse, checkMassMentionLimit,
      getGroupCustomization, isGroupCustomizationEnabled, getMenuDesignWithDefaults, loadMenuDesign, saveMenuDesign,
      getMenuLerMaisText, isMenuAudioEnabled, getMenuAudioPath, formatAIResponse,
      saveParceriasData, isRentalModeActive, getGroupRentalStatus, validateActivationCode, useActivationCode,
      vipCommandsManager, spotifyModule, gdriveGetInfo, mediafireGetInfo, twitterGetInfo,
      removeBg, upscale, search, searchNews,
      setMenuAudio, removeMenuAudio,
      isParceiro: parceriasData?.parceiros?.[sender] || false,
      // Middleware results (pre-computed)
      joinRequestHandled: false, captchaHandled: false, pvBlocked: false,
      // Extras
      subDonoList,
      __dirname: indexDir,
      MODO_LITE_FILE
    };
  } catch (error) {
    console.error('❌ Erro crítico ao construir contexto da mensagem:', error);
    return null;
  }
}
