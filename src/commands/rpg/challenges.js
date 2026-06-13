import { ensureUserPeriodChallenges, isPeriodCompleted } from "../../utils/database.js";

export default {
  name: "desafios",
  description: "Desafios semanais e mensais do RPG",
  commands: ["desafio", "desafiomensal", "desafiosemanal"],
  usage: "{prefix}desafiosemanal [coletar]",
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
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
    const sub = command.toLowerCase();

    ensureUserPeriodChallenges(me);
    const show = sub === 'desafiomensal' ? me.monthlyChallenge : me.weeklyChallenge;
    const labels = { mine: 'Minerações', work: 'Trabalhos', fish: 'Pescarias', explore: 'Explorações', hunt: 'Caçadas', crimeSuccess: 'Crimes OK' };
    
    let text = `🎯 Desafio ${sub === 'desafiomensal' ? 'Mensal' : 'Semanal'}\n\n`;
    for (const t of (show.tasks || [])) {
      text += `  ${labels[t.type] || t.type}: ${t.progress || 0}/${t.target}\n`;
    }
    
    text += `\nPrêmio: ${fmt(show.reward)} ${show.claimed ? '(coletado)' : ''}`;
    
    if (isPeriodCompleted(show) && !show.claimed) {
      text += `\nUse: ${prefix}${sub} coletar`;
    }
    
    if ((args[0] || '').toLowerCase() === 'coletar') {
      if (show.claimed) return reply(MESSAGES.rpg.alreadyClaimed);
      if (!isPeriodCompleted(show)) return reply(MESSAGES.rpg.notCompleted);
      
      me.wallet += show.reward; 
      show.claimed = true; 
      saveEconomy(econ);
      
      return reply(`🎁 Você coletou ${fmt(show.reward)} do ${sub === 'desafiomensal' ? 'desafio mensal' : 'desafio semanal'}!`);
    }
    
    return reply(text);
  }
};
