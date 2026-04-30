import { PREFIX } from "../../config.js";

export default {
  name: "classe",
  description: "Sistema de classes e profissões",
  commands: ["casa", "class", "classe", "dungeon", "house", "lar", "masmorra", "profissao", "raid"],
  usage: `${PREFIX}classe`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    const classes = {
      'guerreiro': { name: 'Guerreiro', emoji: '⚔️' },
      'mago': { name: 'Mago', emoji: '🧙' },
      'arqueiro': { name: 'Arqueiro', emoji: '🏹' },
      'ladino': { name: 'Ladino', emoji: '🗡️' }
    };

    if (!args[0]) {
      let text = `╭━━━⊱ ⚔️ *CLASSES* ⊱━━━╮\n\n`;
      Object.entries(classes).forEach(([id, c]) => {
        text += `${c.emoji} *${c.name}*\n   💡 Use ${prefix}classe ${id}\n\n`;
      });
      return reply(text);
    }
    
    const choice = args[0].toLowerCase();
    if (!classes[choice]) return reply(`💔 Classe não encontrada!`);
    
    me.classe = choice;
    saveEconomy(econ);
    return reply(`✨ Você agora é um *${classes[choice].name}*!`);
  }
};
