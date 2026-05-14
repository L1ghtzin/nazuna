import { PREFIX } from "../../config.js";
import { ensureUserPeriodChallenges, isPeriodCompleted } from "../../utils/database.js";

export default {
  name: "desafios",
  description: "Desafios semanais e mensais do RPG",
  commands: ["desafiomensal", "desafiosemanal"],
  usage: `${PREFIX}desafiosemanal [coletar]`,
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

    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
    const sub = command.toLowerCase();

    ensureUserPeriodChallenges(me);
    const show = sub === 'desafiosemanal' ? me.weeklyChallenge : me.monthlyChallenge;
    const labels = { mine: 'Minerações', work: 'Trabalhos', fish: 'Pescarias', explore: 'Explorações', hunt: 'Caçadas', crimeSuccess: 'Crimes OK' };
    
    let text = `🎯 Desafio ${sub === 'desafiosemanal' ? 'Semanal' : 'Mensal'}\n\n`;
    for (const t of (show.tasks || [])) {
      text += `  ${labels[t.type] || t.type}: ${t.progress || 0}/${t.target}\n`;
    }
    
    text += `\nPrêmio: ${fmt(show.reward)} ${show.claimed ? '(coletado)' : ''}`;
    
    if (isPeriodCompleted(show) && !show.claimed) {
      text += `\nUse: ${prefix}${sub} coletar`;
    }
    
    if ((args[0] || '').toLowerCase() === 'coletar') {
      if (show.claimed) return reply('❌ Você já coletou este prêmio.');
      if (!isPeriodCompleted(show)) return reply('❌ Complete todas as tarefas para coletar.');
      
      me.wallet += show.reward; 
      show.claimed = true; 
      saveEconomy(econ);
      
      return reply(`🎁 Você coletou ${fmt(show.reward)} do ${sub === 'desafiosemanal' ? 'desafio semanal' : 'desafio mensal'}!`);
    }
    
    return reply(text);
  }
};
