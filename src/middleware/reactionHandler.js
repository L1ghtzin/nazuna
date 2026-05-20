import { isGoingEmoji, isNotGoingEmoji, buildRoleAnnouncementText, refreshRoleAnnouncement } from '../utils/roleManager.js';

export async function processReactionMessage(nazu, info, isGroup, sender, groupData, prefix, from, persistGroupDataLocal) {
  try {
    if (!isGroup) {
      return;
    }

    const reaction = info.message?.reactionMessage;
    if (!reaction || !reaction.key || !reaction.key.id) {
      return;
    }

    const targetMessageId = reaction.key.id;
    const emoji = reaction.text || '';
    const actorId = sender;

    if (!actorId) {
      return;
    }

    const roleCode = groupData.roleMessages?.[targetMessageId];
    if (roleCode && groupData.roles && groupData.roles[roleCode]) {
      const roleData = groupData.roles[roleCode];
      roleData.participants = roleData.participants && typeof roleData.participants === 'object' ? roleData.participants : {};
      const goingSet = new Set(Array.isArray(roleData.participants.going) ? roleData.participants.going : []);
      const notGoingSet = new Set(Array.isArray(roleData.participants.notGoing) ? roleData.participants.notGoing : []);
      let changed = false;

      if (!emoji) {
        if (goingSet.delete(actorId) || notGoingSet.delete(actorId)) {
          changed = true;
        }
      } else if (isGoingEmoji(emoji)) {
        if (!goingSet.has(actorId)) {
          changed = true;
        }
        goingSet.add(actorId);
        if (notGoingSet.delete(actorId)) {
          changed = true;
        }
      } else if (isNotGoingEmoji(emoji)) {
        if (!notGoingSet.has(actorId)) {
          changed = true;
        }
        notGoingSet.add(actorId);
        if (goingSet.delete(actorId)) {
          changed = true;
        }
      } else {
        return;
      }

      if (changed) {
        roleData.participants.going = Array.from(goingSet);
        roleData.participants.notGoing = Array.from(notGoingSet);
        roleData.participants.updatedAt = new Date().toISOString();
        persistGroupDataLocal();

        try {
          if (emoji) {
            const confirmationText = isGoingEmoji(emoji)
              ? `🙋 Presença confirmada no rolê *${roleData.title || roleCode}*.`
              : `🤷 Você sinalizou que não vai mais no rolê *${roleData.title || roleCode}*.`;
            await nazu.sendMessage(actorId, {
              text: `${confirmationText}\nCódigo: *${roleCode}*`,
              mentions: [actorId]
            });
          }
        } catch (dmError) {
          console.warn('Não foi possível enviar confirmação de reação:', dmError.message || dmError);
        }

        // Atualiza a mensagem principal do rolê com as novas listas
        await refreshRoleAnnouncement(nazu, from, prefix, groupData, persistGroupDataLocal, roleCode, roleData);
      }
      return true; // handled
    }
    return false;
  } catch (reactionError) {
    console.error('Erro ao processar reação de rolê/resenha:', reactionError);
    return false;
  }
}
