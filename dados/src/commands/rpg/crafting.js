import { PREFIX } from "../../config.js";

export default {
  name: "crafting",
  description: "Sistema de encantamento e reciclagem de itens",
  commands: ["desmontar", "dismantle", "encantar", "enchant"],
  usage: `${PREFIX}encantar`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
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

    // --- ENCANTAR ---
    if (command === 'encantar' || command === 'enchant') {
      return reply('✨ Em breve: Sistema de encantamento de armas!');
    }

    // --- DESMONTAR ---
    if (command === 'desmontar' || command === 'dismantle') {
      return reply('🔨 Em breve: Sistema de desmontar itens para materiais!');
    }
  }
};
