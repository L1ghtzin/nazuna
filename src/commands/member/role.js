import {
  ensureRoleParticipants,
  formatRoleSummary,
  refreshRoleAnnouncement,
  sanitizeRoleCode,
  ROLE_GOING_BASE,
  ROLE_NOT_GOING_BASE
} from "../../utils/roleManager.js";
import { normalizar } from "../../utils/helpers.js";

export default {
  name: "role",
  description: "Consulta e participacao em roles do grupo",
  commands: ["role", "roles", "role.lista", "listaroles", "role.vou", "role.nvou", "role.info", "role.confirmados", "role.participantes"],
  usage: `${global.prefix}role <codigo>`,
  handle: async ({
    bot,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    groupData,
    sender,
    prefix,
    command,
    args,
    getUserName,
    persistGroupData,
    info,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    const sub = command.toLowerCase();
    const groupPrefix = groupData.customPrefix || prefix;
    groupData.roles = groupData.roles || {};
    groupData.roleMessages = groupData.roleMessages || {};

    if (['roles', 'role.lista', 'listaroles'].includes(sub)) {
      const roleEntries = Object.entries(groupData.roles);
      if (!roleEntries.length) return reply(MESSAGES.member.role.noActiveRoles);

      const wantsPv = normalizar(args[0] || '') === 'pv';
      const sendInPv = !isGroupAdmin || wantsPv;
      const sendTarget = sendInPv ? sender : from;
      const listLines = roleEntries.map(([roleCode, roleData], index) => (
        formatRoleSummary(roleCode, roleData, roleEntries.length > 1 ? index : null)
      ));
      const listText = `${MESSAGES.member.role.listHeader}\n\n${listLines.join('\n\n')}\n\n${MESSAGES.member.role.listFooter(groupPrefix, ROLE_GOING_BASE, ROLE_NOT_GOING_BASE)}`;

      try {
        await bot.sendMessage(sendTarget, { text: listText });
        if (sendInPv && sendTarget !== from) {
          await reply(MESSAGES.member.role.sentPv, { mentions: [sender] });
        }
      } catch (error) {
        console.error('Erro ao enviar lista de roles:', error);
        await reply(MESSAGES.member.role.errorSendList);
      }
      return;
    }

    if (sub === 'role.vou') {
      const code = sanitizeRoleCode(args[0] || '');
      if (!code) return reply(MESSAGES.member.role.vouFormat(groupPrefix));

      const roleData = groupData.roles[code];
      if (!roleData) return reply(MESSAGES.member.role.notFound);

      const participants = ensureRoleParticipants(roleData);
      if (participants.going.includes(sender)) {
        return reply(MESSAGES.member.role.alreadyGoing(roleData.title || code));
      }

      participants.going.push(sender);
      participants.notGoing = participants.notGoing.filter(id => id !== sender);
      groupData.roles[code] = roleData;
      await persistGroupData();

      await reply(MESSAGES.member.role.confirmSuccess(roleData.title || code));
      await refreshRoleAnnouncement(bot, from, groupPrefix, groupData, persistGroupData, code, roleData);
      return;
    }

    if (sub === 'role.nvou') {
      const code = sanitizeRoleCode(args[0] || '');
      if (!code) return reply(MESSAGES.member.role.nvouFormat(groupPrefix));

      const roleData = groupData.roles[code];
      if (!roleData) return reply(MESSAGES.member.role.notFound);

      const participants = ensureRoleParticipants(roleData);
      const wasGoing = participants.going.includes(sender);
      participants.going = participants.going.filter(id => id !== sender);
      if (!participants.notGoing.includes(sender)) {
        participants.notGoing.push(sender);
      }

      groupData.roles[code] = roleData;
      await persistGroupData();

      await reply(wasGoing ? MESSAGES.member.role.abandonSuccess(roleData.title || code) : MESSAGES.member.role.alreadyAbandoned(roleData.title || code));
      await refreshRoleAnnouncement(bot, from, groupPrefix, groupData, persistGroupData, code, roleData);
      return;
    }

    if (['role', 'role.confirmados', 'role.participantes', 'role.info'].includes(sub)) {
      const code = sanitizeRoleCode(args[0] || '');
      if (!code) return reply(MESSAGES.member.role.infoFormat(groupPrefix));

      const roleData = groupData.roles[code];
      if (!roleData) return reply(MESSAGES.member.role.notFound);

      const parts = ensureRoleParticipants(roleData);
      const going = parts.going || [];
      const notGoing = parts.notGoing || [];
      const lines = [];
      lines.push(`*${roleData.title || code}*`);
      lines.push(`Codigo: ${code}`);
      if (roleData.when) lines.push(`Quando: ${roleData.when}`);
      if (roleData.where) lines.push(`Onde: ${roleData.where}`);
      if (roleData.description) lines.push(`Descricao: ${roleData.description}`);
      lines.push('');
      lines.push(`Confirmados (${going.length}):`);
      lines.push(going.length ? going.map(id => `- @${getUserName(id)}`).join('\n') : '-');
      lines.push('');
      lines.push(`Desistiram (${notGoing.length}):`);
      lines.push(notGoing.length ? notGoing.map(id => `- @${getUserName(id)}`).join('\n') : '-');

      const mentions = [...going, ...notGoing];
      if (roleData.media) {
        try {
          const buffer = Buffer.from(roleData.media.buffer, 'base64');
          const payload = { caption: lines.join('\n'), mentions };

          if (roleData.media.type === 'image') {
            payload.image = buffer;
            payload.mimetype = roleData.media.mimetype;
          } else if (roleData.media.type === 'video') {
            payload.video = buffer;
            payload.mimetype = roleData.media.mimetype;
            if (roleData.media.gifPlayback) payload.gifPlayback = true;
          }

          await bot.sendMessage(from, payload, { quoted: info });
        } catch {
          await bot.sendMessage(from, { text: lines.join('\n'), mentions }, { quoted: info });
        }
      } else {
        await bot.sendMessage(from, { text: lines.join('\n'), mentions }, { quoted: info });
      }
    }
  }
};
