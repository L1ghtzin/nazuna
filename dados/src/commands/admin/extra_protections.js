import pathz from 'path';

export default {
  name: "extra_protections",
  description: "Proteções adicionais (Anti-Link, Anti-Porn, Anti-Gore)",
  commands: ["antilinkgp", "antilinkcanal", "antilinkch", "antilinksoft", "antiporn", "antigore"],
  handle: async ({ 
    reply, command, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, optimizer, MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);

    const cmd = command.toLowerCase();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);

    // --- ANTIPORN ---
    if (cmd === 'antiporn') {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      groupData.antiporn = !groupData.antiporn;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(groupData.antiporn 
        ? "🔞 *ANTI-PORN ATIVADO*\n\nQualquer imagem ou vídeo adulto enviado neste grupo será detectado e o usuário será banido automaticamente." 
        : "✅ *ANTI-PORN DESATIVADO*\n\nA detecção de conteúdo adulto foi desligada.");
    }

    // --- ANTIGORE ---
    if (cmd === 'antigore') {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      groupData.antigore = !groupData.antigore;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(groupData.antigore 
        ? "🩸 *ANTI-GORE ATIVADO*\n\nQualquer conteúdo de violência extrema ou gore enviado neste grupo causará o banimento automático do membro." 
        : "✅ *ANTI-GORE DESATIVADO*\n\nA detecção de violência/gore foi desligada.");
    }

    // --- ANTILINK GP/CANAL ---
    if (['antilinkgp', 'antilinkcanal', 'antilinkch', 'antilinksoft'].includes(cmd)) {
      let key = cmd;
      if (cmd === 'antilinkch') key = 'antilinkcanal';
      
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      groupData[key] = !groupData[key];
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      
      if (key === 'antilinkgp') {
        const message = groupData.antilinkgp 
          ? `✅ *Antilinkgp foi ativado com sucesso!*\n\nAgora, se alguém enviar links de outros grupos, será banido automaticamente. Mantenha o grupo seguro! 🛡️` 
          : `⚠️ *Antilinkgp foi desativado.*\n\nLinks de outros grupos não serão mais bloqueados. Use com cuidado! 🔓`;
        return reply(message);
      } else if (key === 'antilinkcanal') {
        const message = groupData.antilinkcanal 
          ? `✅ *Antilinkcanal foi ativado!*\n\nNão serão tolerados links de canais neste grupo. Quem desrespeitar, levará ban! 🛡️` 
          : `⚠️ *Antilinkcanal desativado.*\n\nFiquem à vontade, links de canais são permitidos novamente. 🔓`;
        return reply(message);
      } else {
        const status = groupData[key] ? "ATIVADO 🟢" : "DESATIVADO 🔴";
        return reply(`🔗 *PROTEÇÃO DE LINK: ${cmd.toUpperCase()}*\n\nStatus: ${status}`);
      }
    }

    return reply(`✅ Proteção ${cmd} atualizada.`);
  }
};
