import { PREFIX } from "../../config.js";

export default {
  name: "properties",
  description: "Sistema de propriedades e negócios",
  commands: ["coletarpropriedades", "comprarpropriedade", "propriedades"],
  usage: `${PREFIX}propriedades`,
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

    if (command === 'propriedades') {
      return reply('🏠 Em breve: Lista de suas propriedades e negócios!');
    }
  }
};
