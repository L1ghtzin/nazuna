import { ensureUserSkills, skillXpForNext, SKILL_LIST } from "../../utils/database.js";

export default {
  name: "habilidades",
  description: "Ver seu nível de habilidades e estatísticas RPG",
  commands: ["habilidades", "statsrpg"],
  usage: "{prefix}habilidades\n{prefix}statsrpg",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    loadEconomy, 
    saveEconomy,
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const cmd = command.toLowerCase();

    if (cmd === 'habilidades') {
      ensureUserSkills(me);
      let text = `╭━━━⊱ 📚 *HABILIDADES* ⊱━━━╮\n│ ${pushname}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      
      for (const s of SKILL_LIST) {
        const sk = me.skills[s];
        text += `• ${s.toUpperCase()}: Nível ${sk.level} (${sk.xp}/${skillXpForNext(sk.level)})\n`;
      }
      
      return reply(text);
    }

    if (cmd === 'statsrpg') {
      if (!me.stats) me.stats = {};
      
      const totalWealth = (me.wallet || 0) + (me.bank || 0);
      const premiumItems = Object.keys(me.premiumItems || {}).length;
      const achievements = Object.keys(me.achievements || {}).length;
      const pets = (me.pets || []).length;
      
      let text = `╭━━━✧ *MINHAS ESTATÍSTICAS* ✧━━━╮\n`;
      text += `│ ${pushname}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      
      text += `💰 *FINANÇAS*\n`;
      text += `├ Carteira: ${(me.wallet || 0).toLocaleString('pt-BR')}\n`;
      text += `├ Banco: ${(me.bank || 0).toLocaleString('pt-BR')}\n`;
      text += `├ Total: ${totalWealth.toLocaleString('pt-BR')}\n`;
      text += `└ Doações: ${(me.donations?.total || 0).toLocaleString('pt-BR')}\n\n`;
      
      text += `⚔️ *COMBATE*\n`;
      text += `├ Batalhas vencidas: ${me.battlesWon || 0}\n`;
      text += `├ Batalhas perdidas: ${me.battlesLost || 0}\n`;
      text += `├ Duelos: ${me.stats?.duels || 0}\n`;
      text += `└ Crimes: ${me.stats?.crimes || 0}\n\n`;
      
      text += `⛏️ *TRABALHO*\n`;
      text += `├ Trabalhos: ${me.stats?.workCount || 0}\n`;
      text += `├ Mineração: ${me.stats?.mineCount || 0}\n`;
      text += `├ Pesca: ${me.stats?.fishCount || 0}\n`;
      text += `└ Caça: ${me.stats?.huntCount || 0}\n\n`;
      
      text += `🎲 *APOSTAS*\n`;
      text += `├ Ganhou: ${(me.stats?.gamblingWins || 0).toLocaleString('pt-BR')}\n`;
      text += `├ Perdeu: ${(me.stats?.gamblingLosses || 0).toLocaleString('pt-BR')}\n`;
      text += `└ Saldo: ${((me.stats?.gamblingWins || 0) - (me.stats?.gamblingLosses || 0)).toLocaleString('pt-BR')}\n\n`;
      
      text += `📈 *PROGRESSO*\n`;
      text += `├ Level: ${me.level || 1}\n`;
      text += `├ Prestige: ${me.prestige?.level || 0}\n`;
      text += `├ Conquistas: ${achievements}\n`;
      text += `├ Pets: ${pets}\n`;
      text += `└ Itens Premium: ${premiumItems}\n\n`;
      
      text += `⭐ *REPUTAÇÃO*\n`;
      text += `├ Pontos: ${me.reputation?.points || 0}\n`;
      text += `├ Karma: ${me.reputation?.karma || 0}\n`;
      text += `└ Fama: ${me.reputation?.fame || 0}`;
      
      saveEconomy(econ);
      return reply(text);
    }
  }
};
