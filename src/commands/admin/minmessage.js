import fs from 'fs';

export default {
  name: "minmessage",
  description: "Configura o limite mínimo de caracteres em legendas de mídias no grupo",
  commands: ["minmessage"],
  usage: `${global.prefix}minmessage <mínimo de dígitos> <ban/adv>\n${global.prefix}minmessage off`,
  handle: async ({  reply, isGroup, isGroupAdmin, args, prefix, groupData, groupFile , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!args[0]) return reply(`Uso: ${prefix}minmessage <mínimo de dígitos> <ban/adv> ou ${prefix}minmessage off`);
      
      if (args[0].toLowerCase() === 'off') {
        delete groupData.minMessage;
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`✅ Sistema de legenda mínima desativado.`);
      } else {
        const minDigits = parseInt(args[0]);
        const action = args[1]?.toLowerCase();
        
        if (isNaN(minDigits) || minDigits < 1 || !['ban', 'adv'].includes(action)) {
          return reply(`Formato inválido. Use: ${prefix}minmessage <número positivo> <ban/adv>`);
        }
        
        groupData.minMessage = { minDigits, action };
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        
        await reply(`✅ Configurado: Mínimo de ${minDigits} caracteres em legendas de fotos/vídeos. Ação em violação: ${action === 'ban' ? 'banir' : 'advertir'}.`);
      }
    } catch (e) {
      console.error('Erro no comando minmessage:', e);
      await reply("Ocorreu um erro ao configurar 💔");
    }
  }
};
