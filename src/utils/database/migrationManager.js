import fs from 'fs';
import pathz from 'path';
import {
  DATABASE_DIR,
  DONO_DIR,
  GRUPOS_DIR,
  OWNER_CONFIG_FILE,
  MSGPREFIX_FILE,
  MSGBOTON_FILE,
  CMD_NOT_FOUND_FILE,
  SUBDONOS_FILE,
  ALUGUEIS_FILE,
  CODIGOS_ALUGUEL_FILE,
  SUPPORT_TICKETS_FILE,
  MENU_AUDIO_FILE,
  MENU_LERMAIS_FILE,
  GROUP_CUSTOMIZATION_FILE,
  MENU_DESIGN_FILE
} from '../paths.js';
import { read, writeSafe, existsSync } from './io.js';
import { loadGroupDataById, saveGroupDataById } from '../groupManager.js';

const SYSTEM_CONFIG_FILE = pathz.join(DATABASE_DIR, 'systemConfig.json');

export async function runDatabaseConsolidation() {
  const legacyFiles = [
    SYSTEM_CONFIG_FILE,
    MSGPREFIX_FILE,
    MSGBOTON_FILE,
    CMD_NOT_FOUND_FILE,
    SUBDONOS_FILE,
    MENU_DESIGN_FILE,
    pathz.join(DATABASE_DIR, 'antiflood.json'),
    pathz.join(DATABASE_DIR, 'modolite.json'),
    pathz.join(DONO_DIR, 'bangp.json'),
    ALUGUEIS_FILE,
    MENU_AUDIO_FILE,
    MENU_LERMAIS_FILE
  ];

  const hasLegacyFiles = legacyFiles.some(file => existsSync(file));
  const ownerConfigExists = existsSync(OWNER_CONFIG_FILE);

  if (ownerConfigExists && !hasLegacyFiles) {
    return;
  }

  console.log('🔄 [CONSOLIDAÇÃO] Iniciando migração e consolidação do banco de dados...');

  // 1. Carregar Configurações Globais / Dono do systemConfig.json e arquivos individuais
  let ownerConfig = {
    botState: { status: 'on', viewMessages: false },
    antiPV: { mode: 'off', message: '🚫 Este comando só funciona em grupos!' },
    antiSpam: { enabled: false, limit: 5, interval: 10, blockTime: 600 },
    cmdNotFound: { enabled: true, message: '❌ Comando não encontrado! Tente {prefix}menu para ver todos os comandos disponíveis.' },
    msgPrefix: { enabled: false, message: '' },
    msgBotOn: { enabled: true, message: '' },
    subdonos: [],
    premium: [],
    globalBlocks: { commands: {}, users: {} },
    menuDesign: {
      header: `╭┈⊰ 🫟 『 *{botName}* 』\n┊💭 *Usuário:* {userName}\n┊👑 *Prefixo:* {prefix}\n╰─┈┈┈┈┈┈┈┈┈┈◜❁◞┈┈┈┈┈┈┈┈┈┈─╯`,
      menuTopBorder: "╭┈",
      bottomBorder: "╰─┈┈┈┈┈┈┈┈┈┈◜❁◞┈┈┈┈┈┈┈┈┈┈─╯",
      menuTitleIcon: "🍧ฺꕸ▸",
      menuItemIcon: "•.̇𖥨֗🫟⭟",
      separatorIcon: "❁",
      middleBorder: "┊"
    }
  };

  // Se já existe o ownerConfig.json, carregamos ele primeiro para não sobrescrever
  if (existsSync(OWNER_CONFIG_FILE)) {
    try {
      ownerConfig = { ...ownerConfig, ...read(OWNER_CONFIG_FILE, {}) };
    } catch (e) {
      console.error('❌ Erro ao ler ownerConfig.json existente:', e.message);
    }
  }

  let systemConfig = {};
  if (existsSync(SYSTEM_CONFIG_FILE)) {
    try {
      systemConfig = read(SYSTEM_CONFIG_FILE, {});
    } catch (e) {}
  }

  // Migrar dados do systemConfig.json (chaves de arquivos consolidados antigos)
  if (systemConfig['botstate.json']) {
    ownerConfig.botState = { ...ownerConfig.botState, ...systemConfig['botstate.json'] };
  }
  if (systemConfig['antipv.json']) {
    ownerConfig.antiPV = { ...ownerConfig.antiPV, ...systemConfig['antipv.json'] };
  }
  if (systemConfig['antispam.json']) {
    ownerConfig.antiSpam = { ...ownerConfig.antiSpam, ...systemConfig['antispam.json'] };
  }
  if (systemConfig['premium.json']) {
    ownerConfig.premium = systemConfig['premium.json'].users || systemConfig['premium.json'] || [];
  }
  if (systemConfig['globalblocks.json']) {
    ownerConfig.globalBlocks = { ...ownerConfig.globalBlocks, ...systemConfig['globalblocks.json'] };
  }

  // Migrar de arquivos individuais antigos de configurações do dono se existirem
  if (existsSync(MSGPREFIX_FILE)) {
    try {
      const msgPrefixConfig = read(MSGPREFIX_FILE, {});
      ownerConfig.msgPrefix = { enabled: msgPrefixConfig.message !== false, message: msgPrefixConfig.message || '' };
      fs.unlinkSync(MSGPREFIX_FILE);
    } catch (e) {}
  }
  if (existsSync(MSGBOTON_FILE)) {
    try {
      const msgBotOnConfig = read(MSGBOTON_FILE, {});
      ownerConfig.msgBotOn = { enabled: msgBotOnConfig.enabled !== false, message: msgBotOnConfig.message || '' };
      fs.unlinkSync(MSGBOTON_FILE);
    } catch (e) {}
  }
  if (existsSync(CMD_NOT_FOUND_FILE)) {
    try {
      const cmdNotFoundConfig = read(CMD_NOT_FOUND_FILE, {});
      ownerConfig.cmdNotFound = { enabled: cmdNotFoundConfig.enabled !== false, message: cmdNotFoundConfig.message || '' };
      fs.unlinkSync(CMD_NOT_FOUND_FILE);
    } catch (e) {}
  }
  if (existsSync(SUBDONOS_FILE)) {
    try {
      const subdonosConfig = read(SUBDONOS_FILE, {});
      ownerConfig.subdonos = subdonosConfig.subdonos || [];
      fs.unlinkSync(SUBDONOS_FILE);
    } catch (e) {}
  }
  if (existsSync(MENU_DESIGN_FILE)) {
    try {
      const menuDesignConfig = read(MENU_DESIGN_FILE, {});
      ownerConfig.menuDesign = menuDesignConfig;
      fs.unlinkSync(MENU_DESIGN_FILE);
    } catch (e) {}
  }

  // Gravar novo ownerConfig.json consolidado
  fs.mkdirSync(pathz.dirname(OWNER_CONFIG_FILE), { recursive: true });
  writeSafe(OWNER_CONFIG_FILE, ownerConfig);
  console.log('✅ [CONSOLIDAÇÃO] ownerConfig.json criado com sucesso.');

  // 2. Migrar dados específicos de grupos de mapas globais para arquivos de grupos individuais
  const groupsToUpdate = new Map(); // groupId -> partialGroupData

  const getGroupUpdateObject = (groupId) => {
    if (!groupsToUpdate.has(groupId)) {
      groupsToUpdate.set(groupId, {});
    }
    return groupsToUpdate.get(groupId);
  };

  // Migração: Antiflood
  let antifloodData = systemConfig['antiflood.json'] || {};
  if (existsSync(pathz.join(DATABASE_DIR, 'antiflood.json'))) {
    try { antifloodData = read(pathz.join(DATABASE_DIR, 'antiflood.json'), {}); } catch (e) {}
  }
  for (const [groupId, groupFloodConfig] of Object.entries(antifloodData)) {
    if (groupId.endsWith('@g.us')) {
      const update = getGroupUpdateObject(groupId);
      update.antiflood = {
        enabled: groupFloodConfig.enabled || false,
        interval: groupFloodConfig.interval || 5,
        users: groupFloodConfig.users || {}
      };
    }
  }

  // Migração: Modo Lite
  let modoliteData = systemConfig['modolite.json'] || {};
  if (existsSync(pathz.join(DATABASE_DIR, 'modolite.json'))) {
    try { modoliteData = read(pathz.join(DATABASE_DIR, 'modolite.json'), {}); } catch (e) {}
  }
  // Se for array de grupos ou objeto de grupos
  const modoliteGroups = Array.isArray(modoliteData.groups) ? modoliteData.groups : Object.keys(modoliteData.groups || {});
  for (const groupId of modoliteGroups) {
    if (groupId.endsWith('@g.us')) {
      const update = getGroupUpdateObject(groupId);
      update.modolite = true;
    }
  }

  // Migração: Banned Groups (bangp)
  let bangpData = systemConfig['bangp.json'] || {};
  if (existsSync(pathz.join(DONO_DIR, 'bangp.json'))) {
    try { bangpData = read(pathz.join(DONO_DIR, 'bangp.json'), {}); } catch (e) {}
  }
  // Se bangp for array ou objeto de grupos
  const bangpGroups = Array.isArray(bangpData.groups) ? bangpData.groups : (Array.isArray(bangpData) ? bangpData : Object.keys(bangpData || {}));
  for (const groupId of bangpGroups) {
    if (groupId.endsWith('@g.us')) {
      const update = getGroupUpdateObject(groupId);
      update.botBan = { ativo: true, motivo: 'Banido globalmente', createdAt: new Date().toISOString(), createdBy: 'Dono' };
    }
  }

  // Migração: Alugueis (alugueis.json)
  if (existsSync(ALUGUEIS_FILE)) {
    try {
      const rentalConfig = read(ALUGUEIS_FILE, {});
      const groups = rentalConfig.groups || {};
      for (const [groupId, rentalStatus] of Object.entries(groups)) {
        if (groupId.endsWith('@g.us')) {
          const update = getGroupUpdateObject(groupId);
          update.aluguel = {
            ativo: rentalStatus.active || false,
            expiresAt: rentalStatus.expiresAt || null,
            codigoUsado: rentalStatus.codeUsed || null
          };
        }
      }
      fs.unlinkSync(ALUGUEIS_FILE);
    } catch (e) {}
  }

  // Migração: Menu Audio (menuAudio.json)
  if (existsSync(MENU_AUDIO_FILE)) {
    try {
      const audioConfig = read(MENU_AUDIO_FILE, {});
      for (const [groupId, audioPath] of Object.entries(audioConfig)) {
        if (groupId.endsWith('@g.us')) {
          const update = getGroupUpdateObject(groupId);
          update.menuAudio = audioPath || null;
        }
      }
      fs.unlinkSync(MENU_AUDIO_FILE);
    } catch (e) {}
  }

  // Migração: Menu Ler Mais (menuLerMais.json)
  if (existsSync(MENU_LERMAIS_FILE)) {
    try {
      const lerMaisConfig = read(MENU_LERMAIS_FILE, {});
      const lerMaisGroups = Array.isArray(lerMaisConfig) ? lerMaisConfig : Object.keys(lerMaisConfig || {});
      for (const groupId of lerMaisGroups) {
        if (groupId.endsWith('@g.us')) {
          const update = getGroupUpdateObject(groupId);
          update.menuLerMais = true;
        }
      }
      fs.unlinkSync(MENU_LERMAIS_FILE);
    } catch (e) {}
  }

  // 3. Persistir Atualizações nos Arquivos Individuais de Grupos
  if (groupsToUpdate.size > 0) {
    console.log(`📦 [CONSOLIDAÇÃO] Migrando configurações para ${groupsToUpdate.size} grupos individuais...`);
    for (const [groupId, partialData] of groupsToUpdate.entries()) {
      try {
        const groupData = await loadGroupDataById(groupId);
        const merged = { ...groupData, ...partialData };
        // Fazer merge recursivo de propriedades de objeto se necessário
        if (partialData.antiflood && groupData.antiflood) {
          merged.antiflood = { ...groupData.antiflood, ...partialData.antiflood };
        }
        if (partialData.botBan && groupData.botBan) {
          merged.botBan = { ...groupData.botBan, ...partialData.botBan };
        }
        if (partialData.aluguel && groupData.aluguel) {
          merged.aluguel = { ...groupData.aluguel, ...partialData.aluguel };
        }
        await saveGroupDataById(groupId, merged);
      } catch (err) {
        console.error(`❌ Erro ao salvar grupo consolidado ${groupId}:`, err.message);
      }
    }
  }

  // 4. Limpeza de arquivos legados de grupos globais
  const legacyGroupFiles = [
    pathz.join(DATABASE_DIR, 'antiflood.json'),
    pathz.join(DATABASE_DIR, 'modolite.json'),
    pathz.join(DONO_DIR, 'bangp.json'),
    MENU_AUDIO_FILE,
    MENU_LERMAIS_FILE
  ];

  for (const file of legacyGroupFiles) {
    if (existsSync(file)) {
      try { fs.unlinkSync(file); } catch (e) {}
    }
  }

  // Se systemConfig.json existir, podemos deletá-lo ou limpá-lo
  if (existsSync(SYSTEM_CONFIG_FILE)) {
    try { fs.unlinkSync(SYSTEM_CONFIG_FILE); } catch (e) {}
  }

  // Limpeza dos demais arquivos legados individuais
  const remainingLegacyFiles = [
    MSGPREFIX_FILE,
    MSGBOTON_FILE,
    CMD_NOT_FOUND_FILE,
    SUBDONOS_FILE,
    MENU_DESIGN_FILE,
    ALUGUEIS_FILE
  ];
  for (const file of remainingLegacyFiles) {
    if (existsSync(file)) {
      try { fs.unlinkSync(file); } catch (e) {}
    }
  }

  console.log('✅ [CONSOLIDAÇÃO] Banco de dados consolidado com sucesso!');
}
