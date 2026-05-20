import fs from 'fs';

export default {
  name: "whitelist",
  description: "Gerencia a whitelist de administradores para os sistemas anti do grupo",
  commands: ["addwhitelist", "listawhitelist", "removewhitelist", "whitelistlista", "wl.add", "wl.lista", "wl.remove", "wladd", "wllist", "wlremove"],
  usage: `${global.prefix}wl.add @usuario | antilink,antistatus\n${global.prefix}wl.remove @usuario\n${global.prefix}wl.lista`,
  handle: async ({  reply, isGroup, isGroupAdmin, command, menc_os2, q, prefix, groupData, groupFile, sender, getUserName, optimizer , MESSAGES }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

    const cmd = command.toLowerCase();
    groupData.adminWhitelist = groupData.adminWhitelist || {};

    if (['wl.lista', 'wllist', 'listawhitelist', 'whitelistlista', 'listwhite', 'listaunwhite'].includes(cmd)) {
      const entries = Object.entries(groupData.adminWhitelist);
      if (!entries.length) return reply('📋 Whitelist vazia.');
      let msg = `📋 *Whitelist do Grupo*\n\n`;
      entries.forEach(([id, data], i) => {
        msg += `${i+1}. @${getUserName(id)}\n   Antis: ${data.antis.join(', ')}\n\n`;
      });
      return await reply(msg, { mentions: entries.map(e => e[0]) });
    }

    if (['wl.add', 'wladd', 'addwhitelist'].includes(cmd)) {
      if (!menc_os2) return reply(`Uso: ${prefix}wl.add @user | anti1,anti2`);
      const antis = q.split('|')[1]?.split(',').map(a => a.trim().toLowerCase()) || [];
      if (!antis.length) return reply("Especifique os antis!");
      groupData.adminWhitelist[menc_os2] = { antis, addedBy: sender, addedAt: Date.now() };
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ @${getUserName(menc_os2)} adicionado!`, { mentions: [menc_os2] });
    }

    if (['wl.remove', 'wlremove', 'removewhitelist', 'unwhitelist'].includes(cmd)) {
      if (!menc_os2) return reply("Marque o usuário!");
      delete groupData.adminWhitelist[menc_os2];
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Removido da whitelist.");
    }
  }
};
