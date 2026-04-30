import { PREFIX } from "../../config.js";

export default {
  name: "torneio",
  description: "Sistema de torneios do RPG",
  commands: ["torneio", "tournament"],
  usage: `${PREFIX}torneio`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    q, 
    isGroupAdmins,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!econ.tournament) {
      econ.tournament = { active: false, participants: [], startTime: null, prize: 0 };
    }
    
    const tournament = econ.tournament;
    
    // --- CRIAR TORNEIO ---
    if (q === 'criar' && isGroupAdmins) {
      if (tournament.active) return reply(`💔 Já existe um torneio ativo!`);
      tournament.active = true;
      tournament.participants = [];
      tournament.startTime = Date.now();
      tournament.prize = 50000;
      saveEconomy(econ);
      return reply(`╭━━━⊱ 🏆 *TORNEIO ABERTO!* ⊱━━━╮\n⚔️ Um torneio foi iniciado!\n💰 Prêmio: ${tournament.prize.toLocaleString()}\n💡 Use ${prefix}torneio entrar`);
    }

    if (!tournament.active) return reply(`💔 Não há torneio ativo! Admins: Use ${prefix}torneio criar`);

    // --- ENTRAR ---
    if (q === 'entrar') {
      if (tournament.participants.includes(sender)) return reply(`💔 Você já está inscrito!`);
      const entryCost = 5000;
      if (me.wallet < entryCost) return reply(`💰 Você precisa de ${entryCost.toLocaleString()} moedas!`);
      
      me.wallet -= entryCost;
      tournament.participants.push(sender);
      tournament.prize += entryCost;
      saveEconomy(econ);
      return reply(`✅ Você entrou no torneio!\n👥 Participantes: ${tournament.participants.length}\n💰 Prêmio acumulado: ${tournament.prize.toLocaleString()}`);
    }

    // --- INICIAR ---
    if (q === 'iniciar' && isGroupAdmins) {
      if (tournament.participants.length < 2) return reply(`💔 Precisa de pelo menos 2 participantes!`);
      
      let fighters = [...tournament.participants];
      let round = 1;
      let results = `╭━━━⊱ 🏆 *TORNEIO* ⊱━━━╮\n\n`;
      
      while (fighters.length > 1) {
        results += `⚔️ *RODADA ${round}*\n`;
        const nextRound = [];
        for (let i = 0; i < fighters.length; i += 2) {
          if (i + 1 < fighters.length) {
            const winner = Math.random() > 0.5 ? fighters[i] : fighters[i + 1];
            results += `@${fighters[i].split('@')[0]} vs @${fighters[i + 1].split('@')[0]} → ✅ @${winner.split('@')[0]}\n`;
            nextRound.push(winner);
          } else {
            nextRound.push(fighters[i]);
          }
        }
        fighters = nextRound;
        round++;
      }
      
      const winner = fighters[0];
      const winnerData = getEcoUser(econ, winner);
      winnerData.wallet += tournament.prize;
      results += `\n🏆 *CAMPEÃO:* @${winner.split('@')[0]}\n💰 Prêmio: ${tournament.prize.toLocaleString()}`;
      
      tournament.active = false;
      const allParticipants = [...tournament.participants];
      tournament.participants = [];
      saveEconomy(econ);
      return reply(results, { mentions: allParticipants });
    }

    // --- VER INFO ---
    let text = `╭━━━⊱ 🏆 *TORNEIO ATIVO* ⊱━━━╮\n👥 Participantes: ${tournament.participants.length}\n💰 Prêmio: ${tournament.prize.toLocaleString()}\n\n📋 *INSCRITOS:*\n`;
    tournament.participants.slice(0, 10).forEach((p, i) => text += `${i + 1}. @${p.split('@')[0]}\n`);
    text += `\n💡 Use ${prefix}torneio entrar`;
    return reply(text, { mentions: tournament.participants.slice(0, 10) });
  }
};
