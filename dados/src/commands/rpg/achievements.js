import { PREFIX } from "../../config.js";

export default {
  name: "achievements",
  description: "Sistema de conquistas e medalhas",
  commands: ["conquistas", "achievements", "medalhas"],
  usage: `${PREFIX}conquistas`,
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
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    me.achievements = me.achievements || {};
    me.stats = me.stats || { totalMine: 0, totalWork: 0, totalFish: 0, totalHunt: 0, totalExplore: 0, totalBattles: 0, totalWins: 0, totalCrimes: 0 };
    
    const achievements = [
      { id: 'minerador', name: '⛏️ Minerador', desc: 'Minere 100 vezes', req: (me.stats.totalMine || 0) >= 100, progress: `${me.stats.totalMine || 0}/100` },
      { id: 'trabalhador', name: '💼 Trabalhador', desc: 'Trabalhe 50 vezes', req: (me.stats.totalWork || 0) >= 50, progress: `${me.stats.totalWork || 0}/50` },
      { id: 'pescador', name: '🎣 Pescador', desc: 'Pesque 75 vezes', req: (me.stats.totalFish || 0) >= 75, progress: `${me.stats.totalFish || 0}/75` },
      { id: 'milionario', name: '💰 Milionário', desc: 'Tenha 500K no banco', req: (me.bank || 0) >= 500000, progress: `${((me.bank || 0)/1000).toFixed(0)}K/500K` },
      { id: 'veterano', name: '🏆 Veterano', desc: 'Alcance nível 50', req: (me.level || 1) >= 50, progress: `${me.level || 1}/50` },
      { id: 'colecionador', name: '🐾 Colecionador', desc: 'Tenha 5 pets', req: (me.pets?.length || 0) >= 5, progress: `${me.pets?.length || 0}/5` }
    ];
    
    let unlockedCount = 0;
    let text = `╭━━━⊱ 🏅 *CONQUISTAS* ⊱━━━╮\n│ Aventureiro: *${pushname}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    
    achievements.forEach(ach => {
      const unlocked = ach.req;
      if (unlocked && !me.achievements[ach.id]) me.achievements[ach.id] = Date.now();
      if (unlocked) unlockedCount++;
      
      text += `${unlocked ? '✅' : '🔒'} *${ach.name}*\n   ${ach.desc}\n   📊 Progresso: ${ach.progress}\n\n`;
    });
    
    text += `🏆 *Total:* ${unlockedCount}/${achievements.length} conquistas`;
    
    saveEconomy(econ);
    return reply(text);
  }
};
