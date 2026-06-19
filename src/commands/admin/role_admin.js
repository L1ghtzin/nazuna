import {
  buildRoleAnnouncementText,
  ensureRoleParticipants,
  parsePipeArgs,
  sanitizeRoleCode
} from "../../utils/roleManager.js";

export default {
  name: "role_admin",
  description: "Gerenciamento administrativo de roles do grupo",
  commands: ["role.criar", "role.alterar", "role.excluir"],
  usage: `${global.prefix}role.criar CODIGO | Titulo | Quando | Onde | Descricao`,
  handle: async ({
    bot,
    from,
    reply,
    q,
    groupData,
    sender,
    prefix,
    command,
    args,
    persistGroupData,
    info,
    getMediaInfo,
    getFileBuffer,
    MESSAGES
  }) => {
    const sub = command.toLowerCase();
    const groupPrefix = groupData.customPrefix || prefix;
    groupData.roles = groupData.roles || {};
    groupData.roleMessages = groupData.roleMessages || {};

    if (sub === 'role.criar') {
      const parts = parsePipeArgs(q);
      if (parts.length < 1) return reply(MESSAGES.member.role.createFormat(groupPrefix));

      const code = sanitizeRoleCode(parts.shift());
      if (!code) return reply(MESSAGES.member.role.missingCode);
      if (groupData.roles[code]) return reply(MESSAGES.member.role.alreadyExists);

      const roleData = {
        code,
        title: parts[0] || '',
        when: parts[1] || '',
        where: parts[2] || '',
        description: parts.slice(3).join(' | ') || '',
        createdAt: new Date().toISOString(),
        createdBy: sender,
        participants: {
          going: [],
          notGoing: []
        }
      };
      ensureRoleParticipants(roleData);

      const announcementText = buildRoleAnnouncementText(code, roleData, groupPrefix);
      let sentMessage = null;
      let mediaData = null;

      try {
        const mediaInfo = getMediaInfo(info.message);
        if (mediaInfo && (mediaInfo.type === 'image' || mediaInfo.type === 'video')) {
          const buffer = await getFileBuffer(mediaInfo.media, mediaInfo.type);
          mediaData = {
            type: mediaInfo.type,
            buffer: buffer.toString('base64'),
            mimetype: mediaInfo.media.mimetype || (mediaInfo.type === 'image' ? 'image/jpeg' : 'video/mp4'),
            gifPlayback: mediaInfo.type === 'video' && mediaInfo.media.gifPlayback
          };

          const payload = { caption: announcementText };
          if (mediaInfo.type === 'image') {
            payload.image = buffer;
            payload.mimetype = mediaData.mimetype;
          } else {
            payload.video = buffer;
            payload.mimetype = mediaData.mimetype;
            if (mediaData.gifPlayback) payload.gifPlayback = true;
          }
          sentMessage = await bot.sendMessage(from, payload);
        } else {
          sentMessage = await bot.sendMessage(from, { text: announcementText });
        }
      } catch (error) {
        console.error('Erro ao divulgar role:', error);
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
      await persistGroupData();

      return reply(sentMessage ? MESSAGES.member.role.createSuccess(code) : MESSAGES.member.role.createWarn(code, groupPrefix));
    }

    if (sub === 'role.alterar') {
      const parts = parsePipeArgs(q);
      if (!parts.length) return reply(MESSAGES.member.role.alterFormat(groupPrefix));

      const code = sanitizeRoleCode(parts.shift());
      if (!code) return reply(MESSAGES.member.role.invalidCode);

      const roleData = groupData.roles[code];
      if (!roleData) return reply(MESSAGES.member.role.notFound);

      const mediaInfo = getMediaInfo(info.message);
      if (!parts.length && !mediaInfo) return reply(MESSAGES.member.role.missingUpdateFields);

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
          await bot.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
              id: roleData.announcementKey.id,
              participant: roleData.announcementKey.participant || undefined
            }
          });
        } catch (error) {
          console.warn('Nao consegui remover a divulgacao antiga do role:', error.message || error);
        }
      }

      const announcementText = buildRoleAnnouncementText(code, roleData, groupPrefix);
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
          sentMessage = await bot.sendMessage(from, payload);
        } else {
          sentMessage = await bot.sendMessage(from, { text: announcementText });
        }
      } catch (error) {
        console.error('Erro ao reenviar divulgacao do role:', error);
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
      await persistGroupData();
      return reply(MESSAGES.member.role.updateSuccess(code));
    }

    if (sub === 'role.excluir') {
      const code = sanitizeRoleCode(q || args[0] || '');
      if (!code) return reply(MESSAGES.member.role.deleteFormat(groupPrefix));

      const roleData = groupData.roles[code];
      if (!roleData) return reply(MESSAGES.member.role.notFound);

      if (roleData.announcementKey?.id) {
        delete groupData.roleMessages[roleData.announcementKey.id];
        try {
          await bot.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
              id: roleData.announcementKey.id,
              participant: roleData.announcementKey.participant || undefined
            }
          });
        } catch (error) {
          console.warn('Nao consegui remover a divulgacao do role:', error.message || error);
        }
      }

      delete groupData.roles[code];
      await persistGroupData();
      return reply(MESSAGES.member.role.deleteSuccess(code));
    }
  }
};
