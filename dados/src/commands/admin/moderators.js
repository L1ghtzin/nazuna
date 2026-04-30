import fs from 'fs';

export default {
  name: "moderadores",
  description: "Gerencia moderadores do grupo e suas permissões",
  commands: ["addmod", "addmodcmd", "delmod", "delmodcmd", "grantmodcmd", "listmodcmds", "listmods", "modlist", "revokemodcmd"],
  usage: `${global.prefix}addmod @usuario\n${global.prefix}grantmodcmd ban`,
  handle: async ({  reply, isGroup, isGroupAdmin, command, menc_os2, q, prefix, groupData, groupFile, getUserName, groupName, optimizer , MESSAGES }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

    const cmd = command.toLowerCase();
    groupData.moderators = groupData.moderators || {};

    if (['addmod'].includes(cmd)) {
      if (!menc_os2) return reply("Marque o usuário!");
      groupData.moderators[menc_os2] = groupData.moderators[menc_os2] || { commands: [] };
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ @${getUserName(menc_os2)} agora é moderador!`, { mentions: [menc_os2] });
    }

    if (['delmod', 'rmmod'].includes(cmd)) {
      if (!menc_os2) return reply("Marque o usuário!");
      delete groupData.moderators[menc_os2];
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Moderador removido.");
    }

    if (['listmods', 'modlist', 'listmod'].includes(cmd)) {
      const mods = Object.keys(groupData.moderators);
      if (!mods.length) return reply("Vazio.");
      return reply("📋 MODERADORES:\n" + mods.map(m => `@${getUserName(m)}`).join('\n'), { mentions: mods });
    }

    if (['grantmodcmd', 'addmodcmd', 'grantmodcmds'].includes(cmd)) {
      const [user, ...cmds] = q.split(' ');
      if (!menc_os2 || !cmds.length) return reply("Uso: addmodcmd @user ban kick");
      if (!groupData.moderators[menc_os2]) return reply("Usuário não é moderador.");
      groupData.moderators[menc_os2].commands.push(...cmds.map(c => c.toLowerCase()));
      groupData.moderators[menc_os2].commands = [...new Set(groupData.moderators[menc_os2].commands)];
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Permissões adicionadas.");
    }

    if (['revokemodcmd', 'delmodcmd', 'rmmodcmd', 'revokemodcmds'].includes(cmd)) {
      const [user, ...cmds] = q.split(' ');
      if (!menc_os2 || !cmds.length) return reply("Uso: delmodcmd @user ban");
      if (!groupData.moderators[menc_os2]) return reply("Não é moderador.");
      groupData.moderators[menc_os2].commands = groupData.moderators[menc_os2].commands.filter(c => !cmds.includes(c.toLowerCase()));
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Permissões removidas.");
    }

    if (['listmodcmds', 'listmodcmd'].includes(cmd)) {
      if (!menc_os2) return reply("Marque o moderador!");
      const mod = groupData.moderators[menc_os2];
      if (!mod) return reply("Não é moderador.");
      return reply(`📋 Permissões de @${getUserName(menc_os2)}:\n${mod.commands.join(', ')}`, { mentions: [menc_os2] });
    }
  }
};
