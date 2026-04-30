import { PREFIX } from "../../config.js";

export default {
  name: "missoes",
  description: "Sistema de missões diárias",
  commands: ["claim", "missao", "missoes", "quests", "reivindicar"],
  usage: `${PREFIX}missoes`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    command,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!me.quests) {
      me.quests = {
        daily: [],
        lastReset: Date.now()
      };
    }
    
    const now = Date.now();

    // Reset diário (24h)
    if (now - me.quests.lastReset > 86400000) {
      me.quests.daily = [];
      me.quests.lastReset = now;
    }
    
    // Gerar missões diárias se não houver
    if (me.quests.daily.length === 0) {
      const allQuests = [
        { id: 'duel_3', name: '⚔️ Duelar 3 vezes', reward: 5000, exp: 200, progress: 0, goal: 3, claimed: false },
        { id: 'dungeon_2', name: '🗺️ Completar 2 dungeons', reward: 8000, exp: 300, progress: 0, goal: 2, claimed: false },
        { id: 'gather_10', name: '🌾 Coletar 10 recursos', reward: 3000, exp: 150, progress: 0, goal: 10, claimed: false },
        { id: 'cook_5', name: '👨‍🍳 Cozinhar 5 receitas', reward: 4000, exp: 180, progress: 0, goal: 5, claimed: false },
        { id: 'train_pet', name: '🐾 Treinar pet 5 vezes', reward: 6000, exp: 250, progress: 0, goal: 5, claimed: false }
      ];
      
      const shuffled = allQuests.sort(() => Math.random() - 0.5);
      me.quests.daily = shuffled.slice(0, 3);
    }
    
    // Comando Reivindicar
    if (command === 'reivindicar' || command === 'claim') {
      let claimedCount = 0;
      let totalReward = 0;
      let totalExp = 0;
      
      me.quests.daily.forEach(quest => {
        if (quest.progress >= quest.goal && !quest.claimed) {
          quest.claimed = true;
          me.wallet += quest.reward;
          me.exp += quest.exp;
          totalReward += quest.reward;
          totalExp += quest.exp;
          claimedCount++;
        }
      });
      
      if (claimedCount === 0) {
        return reply(`💔 Nenhuma recompensa disponível para reivindicar! Complete as missões primeiro.`);
      }
      
      saveEconomy(econ);
      return reply(`╭━━━⊱ ✅ *RECOMPENSAS* ⊱━━━╮\n\n🎉 Você reivindicou ${claimedCount} missão(ões)!\n\n💰 Dinheiro: +${totalReward.toLocaleString()}\n✨ EXP: +${totalExp}\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
    }
    
    // Mostrar missões
    me.quests.daily.forEach(quest => {
      if (quest.claimed === undefined) quest.claimed = false;
    });
    
    let text = `╭━━━⊱ 📜 *MISSÕES DIÁRIAS* ⊱━━━╮\n`;
    text += `│ Aventureiro: *${pushname}*\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    
    me.quests.daily.forEach((quest, i) => {
      const completed = quest.progress >= quest.goal;
      const claimed = quest.claimed === true;
      text += `${i + 1}. ${quest.name}\n`;
      text += `┌─────────────────\n`;
      text += `│ 📊 Progresso: ${quest.progress}/${quest.goal}\n`;
      text += `│ 💰 Recompensa: ${quest.reward.toLocaleString()}\n`;
      text += `│ ✨ EXP: ${quest.exp}\n`;
      if (claimed) {
        text += `│ ✅ Reivindicado!\n`;
      } else if (completed) {
        text += `│ ✅ Completo! Use ${prefix}reivindicar\n`;
      } else {
        text += `│ ⏳ Em andamento\n`;
      }
      text += `└─────────────────\n\n`;
    });
    
    const timeUntilReset = 86400000 - (now - me.quests.lastReset);
    const hoursLeft = Math.floor(timeUntilReset / 3600000);
    text += `⏰ Reseta em: ${hoursLeft}h`;
    
    saveEconomy(econ);
    return reply(text);
  }
};
