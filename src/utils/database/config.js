// ==================== DATABASE CONFIG ====================
// Configurações gerais do bot: prefix, msgBotOn, cmdNotFound, subdonos, blacklist, menuDesign, etc.

import fs from 'fs';
import pathz from 'path';
import { PREFIX } from '../../config.js';
import { ensureDirectoryExists, loadJsonFile, normalizar, getUserName, isUserId, isValidJid, isGroupId, buildUserId, getLidFromJidCached, getJidFromLid, idsMatch, debouncedSaveJson } from '../helpers.js';
import { writeJsonFile, writeJsonFileQueued } from './_core.js';
import {
  DATABASE_DIR,
  DONO_DIR,
  PARCERIAS_DIR,
  MSGPREFIX_FILE,
  MSGBOTON_FILE,
  CMD_NOT_FOUND_FILE,
  CUSTOM_REACTS_FILE,
  REMINDERS_FILE,
  SUBDONOS_FILE,
  GLOBAL_BLACKLIST_FILE,
  MENU_DESIGN_FILE,
  DIVULGACAO_FILE,
  DONO_DIVULGACAO_FILE,
  RELATIONSHIPS_FILE,
  MODO_LITE_FILE,
  CONFIG_FILE
} from '../paths.js';

// ==================== MSG PREFIX ====================

export const loadMsgPrefix = () => {
  return loadJsonFile(MSGPREFIX_FILE, { message: false }, true).message;
};

export const saveMsgPrefix = (message) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(MSGPREFIX_FILE, { message }, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar msgprefix:', error);
    return false;
  }
};

// ==================== MSG BOT ON ====================

export const loadMsgBotOn = () => {
  const data = loadJsonFile(MSGBOTON_FILE, { 
    enabled: true,
    message: `╭───⊱ 🍥 『 *{botName}* 』 ⊱───╮
┊
┊ ✨ *Oiiiii! Estou online!* ✨
┊
┊ 🚀 *Status:* Pronta para uso!
┊ 🌀 *Evolução:* Ativa
┊
┊ Aproveite a experiência! 🌟
┊
┊ _Para gerenciar este aviso, use:_
┊ ⌨️ *{prefix}msgboton*
┊
╰────⊱ 🍥 ✨ 🍥 ⊱────╯`
  });
  return data;
};

export const saveMsgBotOn = (enabled, message = null) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    const currentData = loadMsgBotOn();
    const newData = {
      enabled: enabled,
      message: message || currentData.message
    };
    debouncedSaveJson(MSGBOTON_FILE, newData, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar msgboton:', error);
    return false;
  }
};

// ==================== CMD NOT FOUND ====================

export const loadCmdNotFoundConfig = () => {
  return loadJsonFile(CMD_NOT_FOUND_FILE, {
    enabled: true,
    message: '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
    style: 'friendly',
    variables: {
      command: '{command}',
      prefix: '{prefix}',
      user: '{user}',
      botName: '{botName}',
      userName: '{userName}'
    }
  }, true);
};

export const saveCmdNotFoundConfig = (config, action = 'update') => {
  try {
    ensureDirectoryExists(DONO_DIR);
    const validatedConfig = {
      enabled: typeof config.enabled === 'boolean' ? config.enabled : true,
      message: config.message || '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.',
      style: ['friendly', 'formal', 'casual', 'emoji'].includes(config.style) ? config.style : 'friendly',
      variables: {
        command: config.variables?.command || '{command}',
        prefix: config.variables?.prefix || '{prefix}',
        user: config.variables?.user || '{user}',
        botName: config.variables?.botName || '{botName}',
        userName: config.variables?.userName || '{userName}'
      },
      lastUpdated: new Date().toISOString()
    };
    debouncedSaveJson(CMD_NOT_FOUND_FILE, validatedConfig, 1000);
    
    const logMessage = `🔧 Configuração de comando não encontrado ${action}:\n` +
      `• Status: ${validatedConfig.enabled ? 'ATIVADO' : 'DESATIVADO'}\n` +
      `• Estilo: ${validatedConfig.style}\n` +
      `• Mensagem: ${validatedConfig.message.substring(0, 50)}${validatedConfig.message.length > 50 ? '...' : ''}\n` +
      `• Em: ${new Date().toLocaleString('pt-BR')}`;
    
    console.log(logMessage);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar configuração de comando não encontrado:', error);
    return false;
  }
};

// ==================== MESSAGE TEMPLATES ====================

export const validateMessageTemplate = (template) => {
  if (!template || typeof template !== 'string') {
    return { valid: false, error: 'Mensagem inválida ou vazia' };
  }
  
  const issues = [];
  
  const openBraces = (template.match(/\{/g) || []).length;
  const closeBraces = (template.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push('Número desigual de chaves abertas e fechadas');
  }
  
  const validVariables = ['{command}', '{prefix}', '{user}', '{botName}', '{userName}'];
  const foundVariables = template.match(/\{[^}]+\}/g) || [];
  
  foundVariables.forEach(variable => {
    if (!validVariables.includes(variable)) {
      issues.push(`Variável inválida: ${variable}`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : null,
    variables: foundVariables
  };
};

export const formatMessageWithFallback = (template, variables, fallbackMessage) => {
  try {
    const validation = validateMessageTemplate(template);
    if (!validation.valid) {
      console.warn('⚠️ Template de mensagem inválido:', validation.issues);
      return fallbackMessage;
    }
    
    let formattedMessage = template;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });
    
    return formattedMessage;
  } catch (error) {
    console.error('❌ Erro ao formatar mensagem:', error);
    return fallbackMessage;
  }
};

// ==================== CUSTOM REACTS ====================

export const loadCustomReacts = () => {
  return loadJsonFile(CUSTOM_REACTS_FILE, { reacts: [] }, true).reacts || [];
};

export const saveCustomReacts = (reacts) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    debouncedSaveJson(CUSTOM_REACTS_FILE, { reacts }, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar custom reacts:', error);
    return false;
  }
};

export const addCustomReact = (trigger, emoji) => {
  if (!trigger || !emoji) return { success: false, message: 'Trigger e emoji são obrigatórios.' };
  const reacts = loadCustomReacts();
  const existing = reacts.find(r => normalizar(r.trigger) === normalizar(trigger));
  if (existing) return { success: false, message: 'Já existe um react para este trigger.' };
  const newReact = { id: Date.now().toString(), trigger: normalizar(trigger), emoji };
  reacts.push(newReact);
  return saveCustomReacts(reacts) ? { success: true, message: 'React adicionado com sucesso!', id: newReact.id } : { success: false, message: 'Erro ao salvar.' };
};

export const deleteCustomReact = (id) => {
  const reacts = loadCustomReacts();
  const filtered = reacts.filter(r => r.id !== id);
  if (filtered.length === reacts.length) return { success: false, message: 'React não encontrado.' };
  return saveCustomReacts(filtered) ? { success: true, message: 'React removido com sucesso!' } : { success: false, message: 'Erro ao salvar.' };
};

// ==================== REMINDERS ====================

export const loadReminders = () => {
  return loadJsonFile(REMINDERS_FILE, { reminders: [] }).reminders || [];
};

export const saveReminders = (reminders) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    debouncedSaveJson(REMINDERS_FILE, { reminders }, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar lembretes:', error);
    return false;
  }
};

// ==================== DIVULGAÇÃO ====================

export const loadDivulgacao = () => {
  return loadJsonFile(DIVULGACAO_FILE, { savedMessage: "" });
};

export const saveDivulgacao = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(DIVULGACAO_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar divulgação.json:', error);
    return false;
  }
};

export const loadDonoDivulgacao = () => {
  return loadJsonFile(DONO_DIVULGACAO_FILE, {
    groups: [],
    message: '',
    schedule: { enabled: false, time: null, lastRun: null },
    stats: { totalSent: 0, lastManual: null, lastAuto: null },
    createdAt: new Date().toISOString()
  });
};

export const saveDonoDivulgacao = (data) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(DONO_DIVULGACAO_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar divulgacao_dono.json:', error);
    return false;
  }
};

// ==================== SUBDONOS ====================

export const loadSubdonos = () => {
  return loadJsonFile(SUBDONOS_FILE, { subdonos: [] }, true).subdonos || [];
};

export const saveSubdonos = subdonoList => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(SUBDONOS_FILE, { subdonos: subdonoList }, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar subdonos:', error);
    return false;
  }
};

export const isSubdono = userId => {
  if (!userId) return false;
  const currentSubdonos = loadSubdonos();
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  return currentSubdonos.some(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoId === userId || subdonoBase === userIdBase;
  });
};

export const addSubdono = async (userId, numerodono, bot = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return { success: false, message: 'ID de usuário inválido. Use o LID ou marque o usuário.' };
  }
  if (bot && isValidJid(userId)) {
    try {
      const lid = await getLidFromJidCached(bot, userId);
      if (lid && lid.includes('@lid')) userId = lid;
    } catch (e) {
      console.warn('Erro ao normalizar JID para LID em addSubdono:', e.message);
    }
  }
  let currentSubdonos = loadSubdonos();
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  const alreadyExists = currentSubdonos.some(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoBase === userIdBase;
  });
  if (alreadyExists) {
    return { success: false, message: '✨ Este usuário já é um subdono!' };
  }
  const config = loadJsonFile(CONFIG_FILE, {});
  const nmrdn_check = buildUserId(numerodono, config);
  const ownerJid = `${numerodono}@s.whatsapp.net`;
  const ownerBase = numerodono.toString().replace(/\D/g, '');
  const userBase = userId.replace(/\D/g, '');
  if (userId === nmrdn_check || userId === ownerJid || (config.lidowner && userId === config.lidowner) || userBase === ownerBase) {
    return { success: false, message: '🤔 O Dono já tem todos os superpoderes! Não dá pra adicionar como subdono. 😉' };
  }
  currentSubdonos.push(userId);
  if (saveSubdonos(currentSubdonos)) {
    return { success: true, message: '🎉 Pronto! Novo subdono adicionado com sucesso! ✨' };
  } else {
    return { success: false, message: '❌ Erro ao salvar a lista de subdonos. Tente novamente.' };
  }
};

export const removeSubdono = async (userId, bot = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return { success: false, message: 'ID de usuário inválido. Use o LID ou marque o usuário.' };
  }
  if (bot && isValidJid(userId)) {
    try {
      const lid = await getLidFromJidCached(bot, userId);
      if (lid && lid.includes('@lid')) userId = lid;
    } catch (e) {
      console.warn('Erro ao normalizar JID para LID em removeSubdono:', e.message);
    }
  }
  let currentSubdonos = loadSubdonos();
  const userIdBase = userId.replace(/@s\.whatsapp\.net|@lid/g, '');
  const foundSubdono = currentSubdonos.find(subdonoId => {
    const subdonoBase = subdonoId.replace(/@s\.whatsapp\.net|@lid/g, '');
    return subdonoBase === userIdBase;
  });
  if (!foundSubdono) {
    return { success: false, message: '🤔 Este usuário não está na lista de subdonos.' };
  }
  const initialLength = currentSubdonos.length;
  currentSubdonos = currentSubdonos.filter(id => {
    const idBase = id.replace(/@s\.whatsapp\.net|@lid/g, '');
    return idBase !== userIdBase;
  });
  if (currentSubdonos.length === initialLength) {
    return { success: false, message: 'Usuário não encontrado na lista (erro inesperado). 🤷' };
  }
  if (saveSubdonos(currentSubdonos)) {
    return { success: true, message: '👋 Pronto! Subdono removido com sucesso! ✨' };
  } else {
    return { success: false, message: '❌ Erro ao salvar a lista após remover o subdono. Tente novamente.' };
  }
};

export const getSubdonos = () => {
  return [...loadSubdonos()];
};

// ==================== GLOBAL BLACKLIST ====================

export const loadGlobalBlacklist = () => {
  const data = loadJsonFile(GLOBAL_BLACKLIST_FILE, { users: [], groups: [] });
  // Se 'users' ainda for um objeto legatório, converte para array
  if (data && data.users && !Array.isArray(data.users)) {
    const arrayUsers = [];
    for (const [key, entry] of Object.entries(data.users)) {
      const cleanJid = key.endsWith('@s.whatsapp.net') ? key : null;
      const cleanLid = key.endsWith('@lid') ? key : null;
      
      const existing = arrayUsers.find(u => (cleanLid && u.lid === cleanLid) || (cleanJid && u.number === cleanJid.replace(/\D/g, '')));
      if (!existing) {
        arrayUsers.push({
          lid: cleanLid || '',
          number: cleanJid ? cleanJid.replace(/\D/g, '') : '',
          name: entry.addedBy || '',
          reason: entry.reason || '',
          createdAt: entry.addedAt || new Date().toISOString(),
          createdBy: entry.addedBy || 'Desconhecido'
        });
      }
    }
    data.users = arrayUsers;
    saveGlobalBlacklist(data);
  }
  return data;
};

export const saveGlobalBlacklist = async data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    await writeJsonFileQueued(GLOBAL_BLACKLIST_FILE, data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar blacklist global:', error);
    return false;
  }
};

export const addGlobalBlacklist = async (userId, reason, addedBy, bot = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return { success: false, message: 'ID de usuário inválido. Use o LID ou marque o usuário.' };
  }
  
  let number = userId.replace(/\D/g, '');
  let lid = userId.includes('@lid') ? userId : '';
  
  if (bot) {
    try {
      const resolvedLid = await getLidFromJidCached(bot, userId);
      if (resolvedLid && resolvedLid.includes('@lid')) {
        lid = resolvedLid;
      }
    } catch (e) {}
  }
  
  if (userId.includes('@lid')) {
    const resolvedJid = getJidFromLid(userId);
    if (resolvedJid) {
      number = resolvedJid.replace(/\D/g, '');
    }
  }

  let blacklistData = loadGlobalBlacklist();
  blacklistData.users = Array.isArray(blacklistData.users) ? blacklistData.users : [];
  
  const exists = blacklistData.users.find(entry => 
    (lid && entry.lid === lid) || 
    (number && entry.number === number) ||
    idsMatch(entry.lid, userId)
  );
  
  if (exists) {
    let modified = false;
    if (lid && !exists.lid) { exists.lid = lid; modified = true; }
    if (number && !exists.number) { exists.number = number; modified = true; }
    if (modified) {
      await saveGlobalBlacklist(blacklistData);
      return { success: true, message: `✨ Mapeamento do usuário @${getUserName(userId)} atualizado na blacklist global!` };
    }
    return { success: false, message: `✨ Usuário @${getUserName(userId)} já está na blacklist global!` };
  }
  
  blacklistData.users.push({
    lid: lid,
    number: number,
    name: getUserName(userId) || undefined,
    reason: reason || 'Não especificado',
    createdAt: new Date().toISOString(),
    createdBy: addedBy || 'Desconhecido'
  });
  
  if (await saveGlobalBlacklist(blacklistData)) {
    return { success: true, message: `🎉 Usuário @${getUserName(userId)} adicionado à blacklist global com sucesso! Motivo: ${reason || 'Não especificado'}` };
  } else {
    return { success: false, message: '😥 Erro ao salvar a blacklist global. Tente novamente!' };
  }
};

export const removeGlobalBlacklist = async (userId, bot = null) => {
  if (!userId || typeof userId !== 'string' || (!isUserId(userId) && !isValidJid(userId))) {
    return { success: false, message: 'ID de usuário inválido. Use o LID ou marque o usuário.' };
  }
  
  let number = userId.replace(/\D/g, '');
  let lid = userId.includes('@lid') ? userId : '';
  
  if (bot && isValidJid(userId)) {
    try {
      const resolvedLid = await getLidFromJidCached(bot, userId);
      if (resolvedLid && resolvedLid.includes('@lid')) {
        lid = resolvedLid;
      }
    } catch (e) {}
  }
  
  let blacklistData = loadGlobalBlacklist();
  blacklistData.users = Array.isArray(blacklistData.users) ? blacklistData.users : [];
  
  const initialLength = blacklistData.users.length;
  blacklistData.users = blacklistData.users.filter(entry => 
    (!lid || entry.lid !== lid) && 
    (!number || entry.number !== number) &&
    !idsMatch(entry.lid, userId)
  );
  
  if (blacklistData.users.length === initialLength) {
    return { success: false, message: `🤔 Usuário @${getUserName(userId)} não está na blacklist global.` };
  }
  
  if (await saveGlobalBlacklist(blacklistData)) {
    return { success: true, message: `👋 Usuário @${getUserName(userId)} removido da blacklist global com sucesso!` };
  } else {
    return { success: false, message: '😥 Erro ao salvar a blacklist global após remoção. Tente novamente!' };
  }
};

export const getGlobalBlacklist = () => {
  return loadGlobalBlacklist();
};

// ==================== MENU DESIGN ====================

export const loadMenuDesign = () => {
  try {
    if (fs.existsSync(MENU_DESIGN_FILE)) {
      return JSON.parse(fs.readFileSync(MENU_DESIGN_FILE, 'utf-8'));
    } else {
      return {
        header: `╭┈⊰ 🫟 『 *{botName}* 』\n┊💭 *Usuário:* {userName}\n┊👑 *Prefixo:* {prefix}\n╰─┈┈┈┈┈┈┈┈┈┈◜❁◞┈┈┈┈┈┈┈┈┈┈─╯`,
        menuTopBorder: "╭┈",
        bottomBorder: "╰─┈┈┈┈┈┈┈┈┈┈◜❁◞┈┈┈┈┈┈┈┈┈┈─╯",
        menuTitleIcon: "🍧ฺꕸ▸",
        menuItemIcon: "•.̇𖥨֗🫟⭟",
        separatorIcon: "❁",
        middleBorder: "┊"
      };
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar design do menu: ${error.message}`);
    return {
      header: `╭┈⊰ 🫟 『 *{botName}* 』\n┊💭 *Usuário:* {userName}\n┊👑 *Prefixo:* {prefix}\n╰─┈┈┈┈┈┈┈┈┈┈◜❁◞┈┈┈┈┈┈┈┈┈┈─╯`,
      menuTopBorder: "╭┈",
      bottomBorder: "╰─┈┈┈┈┈┈┈┈┈┈◜❁◞┈┈┈┈┈┈┈┈┈┈─╯",
      menuTitleIcon: "🍧ฺꕸ▸",
      menuItemIcon: "•.̇𖥨֗🫟⭟",
      separatorIcon: "❁",
      middleBorder: "┊"
    };
  }
};

export const saveMenuDesign = (design) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(MENU_DESIGN_FILE, design, 1000);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar design do menu: ${error.message}`);
    return false;
  }
};

export const getMenuDesignWithDefaults = (botName, userName, prefix) => {
  const design = loadMenuDesign();
  const processedDesign = {};
  for (const [key, value] of Object.entries(design)) {
    if (typeof value === 'string') {
      processedDesign[key] = value
        .replace(/{botName}/g, botName)
        .replace(/{userName}/g, userName)
        .replace(/{prefix}/g, prefix);
    } else {
      processedDesign[key] = value;
    }
  }
  return processedDesign;
};

// ==================== RELATIONSHIPS ====================

export const loadRelationships = () => {
  return loadJsonFile(RELATIONSHIPS_FILE, { pairs: {} });
};

export const saveRelationships = (data = { pairs: {} }) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    debouncedSaveJson(RELATIONSHIPS_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de relacionamento:', error);
    return false;
  }
};

// ==================== MODO LITE ====================

export const isModoLiteActive = (groupData, modoLiteGlobalConfig) => {
  const isModoLiteGlobal = modoLiteGlobalConfig?.status || false;
  const isModoLiteGrupo = groupData?.modolite || false;
  const groupHasSetting = groupData && typeof groupData.modolite === 'boolean';
  if (groupHasSetting) {
    return groupData.modolite;
  }
  return isModoLiteGlobal;
};

// ==================== PARCERIAS ====================

export const loadParceriasData = groupId => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  return loadJsonFile(filePath, { active: false, partners: {} });
};

export const saveParceriasData = (groupId, data) => {
  const filePath = pathz.join(PARCERIAS_DIR, `${groupId}.json`);
  try {
    debouncedSaveJson(filePath, data, 1000);
    return true;
  } catch (error) {
    console.error(`Erro ao salvar dados de parcerias para ${groupId}:`, error);
    return false;
  }
};
