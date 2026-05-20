import { getUserName } from './helpers.js';
import { normalizar } from './normalizer.js';

export const ROLE_GOING_BASE = '🙋';
export const ROLE_NOT_GOING_BASE = '🤷';
export const MAX_MENTIONS_IN_ANNOUNCE = 25;

export const isGoingEmoji = (emoji) => typeof emoji === 'string' && emoji.includes(ROLE_GOING_BASE);
export const isNotGoingEmoji = (emoji) => typeof emoji === 'string' && emoji.includes(ROLE_NOT_GOING_BASE);

export function ensureRoleParticipants(roleData) {
  if (!roleData.participants || typeof roleData.participants !== 'object') {
    roleData.participants = {};
  }
  if (!Array.isArray(roleData.participants.going)) {
    roleData.participants.going = [];
  }
  if (!Array.isArray(roleData.participants.notGoing)) {
    roleData.participants.notGoing = [];
  }
  return roleData.participants;
}

export function buildRoleAnnouncementText(code, roleData, groupPrefix) {
  const participants = ensureRoleParticipants(roleData);
  const going = participants.going || [];
  const notGoing = participants.notGoing || [];
  const lines = [];
  
  lines.push('🪩 *Rolê*');
  lines.push(`🎫 Código: *${code}*`);
  if (roleData.title) lines.push(`📛 Título: ${roleData.title}`);
  if (roleData.when) lines.push(`🗓️ Quando: ${roleData.when}`);
  if (roleData.where) lines.push(`📍 Onde: ${roleData.where}`);
  if (roleData.description) lines.push(`📝 Descrição: ${roleData.description}`);
  lines.push('');
  
  const goingCount = going.length;
  lines.push(`🙋 Confirmados (${goingCount}):`);
  if (goingCount > 0) {
    const goingPreview = going.slice(0, MAX_MENTIONS_IN_ANNOUNCE);
    lines.push(goingPreview.map(id => `• @${getUserName(id)}`).join('\n'));
    if (goingCount > goingPreview.length) lines.push(`… e mais ${goingCount - goingPreview.length}`);
  } else {
    lines.push('• —');
  }
  
  const notGoingCount = notGoing.length;
  lines.push('');
  lines.push(`🤷 Desistiram (${notGoingCount}):`);
  if (notGoingCount > 0) {
    const notGoingPreview = notGoing.slice(0, MAX_MENTIONS_IN_ANNOUNCE);
    lines.push(notGoingPreview.map(id => `• @${getUserName(id)}`).join('\n'));
    if (notGoingCount > notGoingPreview.length) lines.push(`… e mais ${notGoingCount - notGoingPreview.length}`);
  } else {
    lines.push('• —');
  }
  
  lines.push('');
  lines.push(`🙋 Reaja com ${ROLE_GOING_BASE} ou use ${groupPrefix}role.vou ${code}`);
  lines.push(`🤷 Reaja com ${ROLE_NOT_GOING_BASE} ou use ${groupPrefix}role.nvou ${code}`);
  
  return lines.join('\n');
}

export async function refreshRoleAnnouncement(nazu, from, prefix, groupData, persistGroupData, code, roleData) {
  try {
    if (!roleData || !roleData.announcementKey || !roleData.announcementKey.id) return;
    
    try {
      await nazu.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
          id: roleData.announcementKey.id,
          participant: roleData.announcementKey.participant || undefined
        }
      });
    } catch (e) {
      console.warn('Não consegui remover a divulgação antiga do rolê (reação):', e.message || e);
    }
    
    const announcementText = buildRoleAnnouncementText(code, roleData, prefix);
    const goingList = roleData.participants?.going || [];
    const notGoingList = roleData.participants?.notGoing || [];
    const mentions = [
      ...goingList.slice(0, MAX_MENTIONS_IN_ANNOUNCE),
      ...notGoingList.slice(0, MAX_MENTIONS_IN_ANNOUNCE)
    ];
    
    const sentMessage = await nazu.sendMessage(from, { text: announcementText, mentions });
    
    if (sentMessage?.key?.id) {
      if (!groupData.roleMessages || typeof groupData.roleMessages !== 'object') {
        groupData.roleMessages = {};
      }
      delete groupData.roleMessages[roleData.announcementKey.id];
      groupData.roleMessages[sentMessage.key.id] = code;
      
      roleData.announcementKey = {
        id: sentMessage.key.id,
        fromMe: sentMessage.key.fromMe ?? true,
        participant: sentMessage.key.participant || null
      };
      
      if (!groupData.roles || typeof groupData.roles !== 'object') {
        groupData.roles = {};
      }
      groupData.roles[code] = roleData;
      
      // Persiste os dados alterados
      persistGroupData();
    }
  } catch (e) {
    console.error('Erro ao atualizar anúncio do rolê:', e);
  }
}

export const parsePipeArgs = (input) => (input || '').split('|').map(part => part.trim()).filter(Boolean);

export const sanitizeRoleCode = (code) => normalizar(code || '', true).replace(/[^0-9a-z]/gi, '').toUpperCase();

export const formatRoleSummary = (code, roleData, index = null) => {
  const participants = ensureRoleParticipants(roleData);
  const goingCount = participants.going.length;
  const notGoingCount = participants.notGoing.length;
  const lines = [];
  if (index !== null) {
    lines.push(`*${index + 1}.*`);
  }
  lines.push(`🎫 *Código:* ${code}`);
  if (roleData.title) {
    lines.push(`📛 *Título:* ${roleData.title}`);
  }
  if (roleData.when) {
    lines.push(`🗓️ *Quando:* ${roleData.when}`);
  }
  if (roleData.where) {
    lines.push(`📍 *Onde:* ${roleData.where}`);
  }
  if (roleData.description) {
    lines.push(`📝 *Descrição:* ${roleData.description}`);
  }
  lines.push(`🙋 *Confirmados:* ${goingCount}`);
  lines.push(`🤷 *Desistências:* ${notGoingCount}`);
  return lines.join('\n');
};

export const formatMentionList = (ids) => ids.map(id => `@${getUserName(id)}`).join(' ');
