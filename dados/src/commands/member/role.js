import { normalizar } from "../../utils/helpers.js";

// ==== Helpers de Rolê ====
function ensureRoleParticipants(roleData) {
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

const MAX_MENTIONS_IN_ANNOUNCE = 25;
const ROLE_GOING_BASE = '🙋';
const ROLE_NOT_GOING_BASE = '🤷';

function buildRoleAnnouncementText(code, roleData, groupPrefix, getUserName) {
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

const parsePipeArgs = (input) => (input || '').split('|').map(part => part.trim()).filter(Boolean);
const sanitizeRoleCode = (code) => normalizar(code || '', true).replace(/[^0-9a-z]/gi, '').toUpperCase();

const formatRoleSummary = (code, roleData, getUserName, index = null) => {
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

export default {
  name: "role",
  description: "Sistema de gestão de rolês e eventos no grupo",
  commands: ["role", "roles", "role.lista", "listaroles", "role.criar", "role.alterar", "role.excluir", "role.vou", "role.nvou", "role.info", "role.confirmados", "role.participantes"],
  usage: `${global.prefix}role <subcomando>`,
  handle: async ({ 
    nazu,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    q,
    groupData,
    sender,
    prefix,
    command,
    args,
    getUserName,
    persistGroupData,
    info,
    getMediaInfo,
    getFileBuffer,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');

    const sub = command.toLowerCase();
    const groupPrefix = groupData.customPrefix || prefix;

    async function refreshRoleAnnouncementInternal(code, roleData) {
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
        const announcementText = buildRoleAnnouncementText(code, roleData, groupPrefix, getUserName);
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
          persistGroupData();
        }
      } catch (e) {
        console.error('Erro ao atualizar anúncio do rolê:', e);
      }
    }

    // LISTAR ROLES
    if (['roles', 'role.lista', 'listaroles'].includes(sub)) {
      const roleEntries = Object.entries(groupData.roles || {});
      if (!roleEntries.length) {
        return reply('🪩 Nenhum rolê ativo no momento.');
      }

      const wantsPv = normalizar(args[0] || '') === 'pv';
      const sendInPv = !isGroupAdmin || wantsPv;
      const sendTarget = sendInPv ? sender : from;
      const listLines = roleEntries.map(([roleCode, roleData], index) => formatRoleSummary(roleCode, roleData, getUserName, roleEntries.length > 1 ? index : null));
      const listText = `🪩 *Rolês ativos*\n\n${listLines.join('\n\n')}\n\n🙋 Reaja com ${ROLE_GOING_BASE} ou use ${groupPrefix}role.vou CODIGO\n🤷 Reaja com ${ROLE_NOT_GOING_BASE} ou use ${groupPrefix}role.nvou CODIGO`;

      try {
        await nazu.sendMessage(sendTarget, { text: listText });
        if (sendInPv && sendTarget !== from) {
          await reply('📬 Enviei a lista de rolês no seu privado!', { mentions: [sender] });
        }
      } catch (listError) {
        console.error('Erro ao enviar lista de rolês:', listError);
        await reply(`💔 Não consegui enviar a lista de rolês agora. Tente novamente mais tarde.`);
      }
      return;
    }

    // CRIAR ROLE
    if (sub === 'role.criar') {
      if (!isGroupAdmin) return reply('🚫 Apenas administradores podem criar rolês.');

      const parts = parsePipeArgs(q);
      if (parts.length < 1) {
        return reply(`📋 Formato esperado:\n${groupPrefix}role.criar CODIGO | Título/Descrição\n\n*Opcional:* CODIGO | Título | Data/Horário | Local | Observações`);
      }

      const code = sanitizeRoleCode(parts.shift());
      if (!code) return reply(`💔 Informe um código alfanumérico para o rolê.`);
      if (groupData.roles[code]) return reply(`💔 Já existe um rolê cadastrado com esse código.`);

      const title = parts[0] || '';
      const when = parts[1] || '';
      const where = parts[2] || '';
      const description = parts.slice(3).join(' | ') || '';

      const roleData = {
        code,
        title,
        when,
        where,
        description,
        createdAt: new Date().toISOString(),
        createdBy: sender,
        participants: {
          going: [],
          notGoing: []
        }
      };
      ensureRoleParticipants(roleData);

      const lines = [
        '🪩 *Novo rolê confirmado!*',
        `🎫 Código: *${code}*`
      ];
      if (title) lines.push(`📛 Título: ${title}`);
      if (when) lines.push(`🗓️ Quando: ${when}`);
      if (where) lines.push(`📍 Onde: ${where}`);
      if (description) lines.push(`📝 Descrição: ${description}`);
      lines.push('');
      lines.push(`🙋 Reaja com ${ROLE_GOING_BASE} ou use ${groupPrefix}role.vou ${code}`);
      lines.push(`🤷 Reaja com ${ROLE_NOT_GOING_BASE} ou use ${groupPrefix}role.nvou ${code}`);
      const announcementText = lines.join('\n');

      let sentMessage = null;
      let mediaData = null;
      try {
        const mediaInfo = getMediaInfo(info.message);
        if (mediaInfo && (mediaInfo.type === 'image' || mediaInfo.type === 'video')) {
          const buffer = await getFileBuffer(mediaInfo.media, mediaInfo.type);
          const payload = { caption: announcementText };
          
          mediaData = {
            type: mediaInfo.type,
            buffer: buffer.toString('base64'),
            mimetype: mediaInfo.media.mimetype || (mediaInfo.type === 'image' ? 'image/jpeg' : 'video/mp4'),
            gifPlayback: mediaInfo.type === 'video' && mediaInfo.media.gifPlayback
          };
          
          if (mediaInfo.type === 'image') {
            payload.image = buffer;
            payload.mimetype = mediaData.mimetype;
          } else {
            payload.video = buffer;
            payload.mimetype = mediaData.mimetype;
            if (mediaData.gifPlayback) payload.gifPlayback = true;
          }
          sentMessage = await nazu.sendMessage(from, payload);
        } else {
          sentMessage = await nazu.sendMessage(from, { text: announcementText });
        }
      } catch (sendError) {
        console.error('Erro ao divulgar rolê:', sendError);
      }

      if (sentMessage?.key?.id) {
        roleData.announcementKey = {
          id: sentMessage.key.id,
          fromMe: sentMessage.key.fromMe ?? true,
          participant: sentMessage.key.participant || null
        };
        groupData.roleMessages[sentMessage.key.id] = code;
      } else {
        roleData.announcementKey = null;
      }
      
      if (mediaData) roleData.media = mediaData;

      groupData.roles[code] = roleData;
      persistGroupData();

      await reply(sentMessage ? `✅ Rolê *${code}* cadastrado e divulgado!` : `⚠️ Rolê *${code}* salvo, mas não consegui enviar a divulgação automaticamente. Use ${groupPrefix}roles para compartilhar.`);
      return;
    }

    // ALTERAR ROLE
    if (sub === 'role.alterar') {
      if (!isGroupAdmin) return reply('🚫 Apenas administradores podem alterar rolês.');

      const parts = parsePipeArgs(q);
      if (!parts.length) {
        return reply(`📋 Formato esperado:\n${groupPrefix}role.alterar CODIGO | Novo título | Novo horário | Novo local | Nova descrição`);
      }

      const code = sanitizeRoleCode(parts.shift());
      if (!code) return reply(`💔 Informe um código válido para o rolê.`);

      const roleData = groupData.roles[code];
      if (!roleData) return reply(`💔 Não encontrei nenhum rolê com esse código.`);

      const mediaInfo = getMediaInfo(info.message);
      if (!parts.length && !mediaInfo) {
        return reply('ℹ️ Informe pelo menos um campo para atualização ou envie uma nova mídia.');
      }

      if (parts[0]) roleData.title = parts[0];
      if (parts[1]) roleData.when = parts[1];
      if (parts[2]) roleData.where = parts[2];
      if (parts.length > 3) roleData.description = parts.slice(3).join(' | ');

      roleData.updatedAt = new Date().toISOString();
      roleData.updatedBy = sender;
      ensureRoleParticipants(roleData);

      if (roleData.announcementKey?.id) {
        delete groupData.roleMessages[roleData.announcementKey.id];
        try {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
              id: roleData.announcementKey.id,
              participant: roleData.announcementKey.participant || undefined
            }
          });
        } catch (deleteErr) {
          console.warn('Não consegui remover a divulgação antiga do rolê:', deleteErr.message || deleteErr);
        }
      }

      const announcementText = buildRoleAnnouncementText(code, roleData, groupPrefix, getUserName);
      let sentMessage = null;
      try {
        if (mediaInfo && (mediaInfo.type === 'image' || mediaInfo.type === 'video')) {
          const buffer = await getFileBuffer(mediaInfo.media, mediaInfo.type);
          const payload = { caption: announcementText };
          if (mediaInfo.type === 'image') {
            payload.image = buffer;
            payload.mimetype = mediaInfo.media.mimetype || 'image/jpeg';
          } else {
            payload.video = buffer;
            payload.mimetype = mediaInfo.media.mimetype || 'video/mp4';
            if (mediaInfo.media.gifPlayback) payload.gifPlayback = true;
          }
          sentMessage = await nazu.sendMessage(from, payload);
        } else {
          sentMessage = await nazu.sendMessage(from, { text: announcementText });
        }
      } catch (updateErr) {
        console.error('Erro ao reenviar divulgação do rolê:', updateErr);
      }

      if (sentMessage?.key?.id) {
        roleData.announcementKey = {
          id: sentMessage.key.id,
          fromMe: sentMessage.key.fromMe ?? true,
          participant: sentMessage.key.participant || null
        };
        groupData.roleMessages[sentMessage.key.id] = code;
      } else {
        roleData.announcementKey = null;
      }

      groupData.roles[code] = roleData;
      persistGroupData();
      await reply(`✅ Rolê *${code}* atualizado.`);
      return;
    }

    // EXCLUIR ROLE
    if (sub === 'role.excluir') {
      if (!isGroupAdmin) return reply('🚫 Apenas administradores podem excluir rolês.');

      const code = sanitizeRoleCode(q || args[0] || '');
      if (!code) return reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.excluir CODIGO`);

      const roleData = groupData.roles[code];
      if (!roleData) return reply(`💔 Não encontrei nenhum rolê com esse código.`);

      if (roleData.announcementKey?.id) {
        delete groupData.roleMessages[roleData.announcementKey.id];
        try {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
              id: roleData.announcementKey.id,
              participant: roleData.announcementKey.participant || undefined
            }
          });
        } catch (deleteErr) {
          console.warn('Não consegui remover a divulgação do rolê:', deleteErr.message || deleteErr);
        }
      }

      delete groupData.roles[code];
      persistGroupData();
      await reply(`🗑️ Rolê *${code}* removido.`);
      return;
    }

    // VOU (CONFIRMAR PRESENÇA)
    if (sub === 'role.vou') {
      const code = sanitizeRoleCode(args[0] || '');
      if (!code) return reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.vou CODIGO`);

      const roleData = groupData.roles[code];
      if (!roleData) return reply(`💔 Não encontrei nenhum rolê com esse código.`);

      const participants = ensureRoleParticipants(roleData);
      if (participants.going.includes(sender)) {
        return reply(`🙋 Você já confirmou presença no rolê *${roleData.title || code}*.`);
      }

      participants.going.push(sender);
      participants.notGoing = participants.notGoing.filter(id => id !== sender);
      groupData.roles[code] = roleData;
      persistGroupData();

      await reply(`✅ Presença confirmada no rolê *${roleData.title || code}*.`);
      await refreshRoleAnnouncementInternal(code, roleData);
      return;
    }

    // NVOU (DESISTIR)
    if (sub === 'role.nvou') {
      const code = sanitizeRoleCode(args[0] || '');
      if (!code) return reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.nvou CODIGO`);

      const roleData = groupData.roles[code];
      if (!roleData) return reply(`💔 Não encontrei nenhum rolê com esse código.`);

      const participants = ensureRoleParticipants(roleData);
      const wasGoing = participants.going.includes(sender);

      participants.going = participants.going.filter(id => id !== sender);
      if (!participants.notGoing.includes(sender)) {
        participants.notGoing.push(sender);
      }

      groupData.roles[code] = roleData;
      persistGroupData();

      await reply(wasGoing ? `🤷 Presença removida do rolê *${roleData.title || code}*.` : `🤷 Você já estava marcado como ausente para o rolê *${roleData.title || code}*.`);
      await refreshRoleAnnouncementInternal(code, roleData);
      return;
    }

    // INFO / PARTICIPANTES
    if (['role', 'role.confirmados', 'role.participantes', 'role.info'].includes(sub)) {
      const code = sanitizeRoleCode(args[0] || '');
      if (!code) return reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role CODIGO`);
      
      const roleData = groupData.roles[code];
      if (!roleData) return reply(`💔 Não encontrei nenhum rolê com esse código.`);
      
      const parts = ensureRoleParticipants(roleData);
      const going = parts.going || [];
      const notGoing = parts.notGoing || [];
      const lines = [];
      lines.push(`🪩 *${roleData.title || code}*`);
      lines.push(`🎫 Código: ${code}`);
      if (roleData.when) lines.push(`🗓️ Quando: ${roleData.when}`);
      if (roleData.where) lines.push(`📍 Onde: ${roleData.where}`);
      if (roleData.description) lines.push(`📝 Descrição: ${roleData.description}`);
      lines.push('');
      lines.push(`🙋 Confirmados (${going.length}):`);
      lines.push(going.length ? going.map(id => `• @${getUserName(id)}`).join('\n') : '• —');
      lines.push('');
      lines.push(`🤷 Desistiram (${notGoing.length}):`);
      lines.push(notGoing.length ? notGoing.map(id => `• @${getUserName(id)}`).join('\n') : '• —');
      
      if (roleData.media) {
        try {
          const buffer = Buffer.from(roleData.media.buffer, 'base64');
          const payload = {
            caption: lines.join('\n'),
            mentions: [...going, ...notGoing]
          };
          
          if (roleData.media.type === 'image') {
            payload.image = buffer;
            payload.mimetype = roleData.media.mimetype;
          } else if (roleData.media.type === 'video') {
            payload.video = buffer;
            payload.mimetype = roleData.media.mimetype;
            if (roleData.media.gifPlayback) payload.gifPlayback = true;
          }
          
          await nazu.sendMessage(from, payload, { quoted: info });
        } catch (mediaError) {
          await nazu.sendMessage(from, { text: lines.join('\n'), mentions: [...going, ...notGoing] }, { quoted: info });
        }
      } else {
        await nazu.sendMessage(from, { text: lines.join('\n'), mentions: [...going, ...notGoing] }, { quoted: info });
      }
      return;
    }
  }
};
