
export default {
  name: "torneio",
  description: "Sistema de torneios do RPG",
  commands: ["torneio", "tournament"],
  usage: "{prefix}torneio",
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
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!econ.tournament) {
      econ.tournament = { active: false, participants: [], startTime: null, prize: 0 };
    }
    
    const tournament = econ.tournament;
    
    // --- CRIAR TORNEIO ---
    if (q === 'criar' && isGroupAdmins) {
      if (tournament.active) return reply(MESSAGES.rpg.tournament.alreadyActive);
      tournament.active = true;
      tournament.participants = [];
      tournament.startTime = Date.now();
      tournament.prize = 50000;
      saveEconomy(econ);
      return reply(MESSAGES.rpg.tournament.opened(tournament.prize.toLocaleString(), prefix));
    }

    if (!tournament.active) return reply(MESSAGES.rpg.tournament.noneActive(prefix));

    // --- ENTRAR ---
    if (q === 'entrar') {
      if (tournament.participants.includes(sender)) return reply(MESSAGES.rpg.tournament.alreadyEntered);
      const entryCost = 5000;
      if (me.wallet < entryCost) return reply(MESSAGES.rpg.insufficientCoins(entryCost.toLocaleString()));
      
      me.wallet -= entryCost;
      tournament.participants.push(sender);
      tournament.prize += entryCost;
      saveEconomy(econ);
      return reply(MESSAGES.rpg.tournament.joined(tournament.participants.length, tournament.prize.toLocaleString()));
    }

    // --- INICIAR ---
    if (q === 'iniciar' && isGroupAdmins) {
      if (tournament.participants.length < 2) return reply(MESSAGES.rpg.tournament.needMorePlayers);
      
      let fighters = [...tournament.participants];
      let round = 1;
      let results = MESSAGES.rpg.tournament.header;
      
      while (fighters.length > 1) {
        results += MESSAGES.rpg.tournament.roundStart(round);
        const nextRound = [];
        for (let i = 0; i < fighters.length; i += 2) {
          if (i + 1 < fighters.length) {
            const winner = Math.random() > 0.5 ? fighters[i] : fighters[i + 1];
            results += MESSAGES.rpg.tournament.matchResult(fighters[i].split('@')[0], fighters[i + 1].split('@')[0], winner.split('@')[0]);
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
      results += MESSAGES.rpg.tournament.champion(winner.split('@')[0], tournament.prize.toLocaleString());
      
      tournament.active = false;
      const allParticipants = [...tournament.participants];
      tournament.participants = [];
      saveEconomy(econ);
      return reply(results, { mentions: allParticipants });
    }

    // --- VER INFO ---
    let text = MESSAGES.rpg.tournament.infoMenu + MESSAGES.rpg.tournament.infoStats(tournament.participants.length, tournament.prize.toLocaleString());
    tournament.participants.slice(0, 10).forEach((p, i) => text += MESSAGES.rpg.tournament.participantLine(i + 1, p.split('@')[0]));
    text += MESSAGES.rpg.tournament.footer(prefix);
    return reply(text, { mentions: tournament.participants.slice(0, 10) });
  }
};
