import pathz from 'path';

export default {
  name: "group_admin_extra",
  description: "Comandos extras de administração de grupo",
  commands: [
    "mute2", "mutar2", "desmute2", "desmutar2", "unmute2",
    "legendabv", "textbv", "welcomemsg", "autosticker", "autorepo", "autoresposta"
  ],
  handle: async ({ 
    reply, command, isGroup, isGroupAdmin, isBotAdmin, from, q, 
    groupData, DATABASE_DIR, optimizer, prefix, MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);

    const cmd = command.toLowerCase();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);

    // --- AUTOSTICKER ---
    if (cmd === 'autosticker') {
      groupData.autoSticker = !groupData.autoSticker;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(`✨ Auto figurinhas ${groupData.autoSticker ? 'ativadas' : 'desativadas'}! ${groupData.autoSticker ? 'Todas as imagens e vídeos serão convertidos em figurinhas.' : ''}`);
    }

    // --- AUTOREPO / AUTOREPOSTA ---
    if (['autorepo', 'autoresposta'].includes(cmd)) {
      groupData.autorepo = !groupData.autorepo;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(`✨ Auto resposta ${groupData.autorepo ? 'ativada' : 'desativada'}!`);
    }

    // --- BOAS-VINDAS ---
    if (['legendabv', 'textbv', 'welcomemsg'].includes(cmd)) {
      if (!q) return reply(`📝 *Configuração da Mensagem de Boas-Vindas*\n\nPara definir uma mensagem personalizada, digite o comando seguido do texto desejado. Você pode usar as seguintes variáveis:\n\n- *#numerodele#* → Marca o novo membro.\n- *#nomedogp#* → Nome do grupo.\n- *#desc#* → Descrição do grupo.\n- *#membros#* → Número total de membros no grupo.\n\n📌 *Exemplo:*\n${prefix}legendabv Bem-vindo(a) #numerodele# ao grupo *#nomedogp#*! Agora somos #membros# membros. Leia a descrição: #desc#`);
      groupData.textbv = q;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(`✅ *Mensagem de boas-vindas configurada com sucesso!*\n\n📌 Nova mensagem:\n"${groupData.textbv}"`);
    }

    // --- MUTE2 ---
    if (['mute2', 'mutar2'].includes(cmd)) {
      groupData.mute = true;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply("🔇 Grupo mutado (Mute2)!");
    }

    if (['unmute2', 'desmute2', 'desmutar2'].includes(cmd)) {
      groupData.mute = false;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply("🔊 Grupo desmutado!");
    }

    return reply(`✅ Configuração ${cmd} atualizada.`);
  }
};
