import { PREFIX } from "../../config.js";

export default {
  name: "habilidades",
  description: "Ver seu nível de habilidades e profissões",
  commands: ["habilidades", "statsrpg"],
  usage: `${PREFIX}habilidades`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    loadEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    let text = `╭━━━⊱ 📚 *HABILIDADES* ⊱━━━╮\n│ ${pushname}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    if (me.skills) {
      Object.entries(me.skills).forEach(([s, data]) => {
        text += `• ${s.toUpperCase()}: Nível ${data.level}\n`;
      });
    } else {
      text += `💔 Nenhuma habilidade registrada.`;
    }
    
    return reply(text);
  }
};
