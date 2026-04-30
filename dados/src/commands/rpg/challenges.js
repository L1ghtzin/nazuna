import { PREFIX } from "../../config.js";

export default {
  name: "desafios",
  description: "Desafios semanais e mensais do RPG",
  commands: ["desafiomensal", "desafiosemanal"],
  usage: `${PREFIX}desafios`,
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

    return reply(`🏅 *DESAFIOS RPG* 🏅\n\nEm breve: Sistema de desafios com recompensas exclusivas!`);
  }
};
