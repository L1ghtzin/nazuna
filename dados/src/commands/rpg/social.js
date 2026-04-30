import { PREFIX } from "../../config.js";

export default {
  name: "socialrpg",
  description: "Interações sociais e reputação no RPG",
  commands: ["abracarrpg", "baterrpg", "beijarrpg", "hugrpg", "kissrpg", "meustats", "mystats", "protect", "proteger", "rep", "reputacao", "reputation", "slaprpg", "statsrpg", "taparpg", "votar", "vote"],
  usage: `${PREFIX}abracarrpg @user`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    menc_jid2,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    timeLeft,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const target = (menc_jid2 && menc_jid2[0]) || null;

    // --- MEUSTATS ---
    if (command === 'meustats' || command === 'mystats' || command === 'statsrpg') {
      const totalWealth = (me.wallet || 0) + (me.bank || 0);
      let text = `╭━━━⊱ 📊 *RPG STATS* ⊱━━━╮\n`;
      text += `│ 👤 ${pushname}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `💰 *FINANÇAS*\n`;
      text += `├ Carteira: ${me.wallet.toLocaleString()}\n`;
      text += `├ Banco: ${me.bank.toLocaleString()}\n`;
      text += `├ Total: ${totalWealth.toLocaleString()}\n\n`;
      text += `⚔️ *COMBATE*\n`;
      text += `├ Vitórias: ${me.battlesWon || 0}\n`;
      text += `├ Derrotas: ${me.battlesLost || 0}\n`;
      text += `└ Level: ${me.level || 1}\n\n`;
      text += `⭐ Reputação: ${me.reputation?.points || 0}`;
      return reply(text);
    }

    // --- ABRAÇAR ---
    if (command === 'abracarrpg' || command === 'hugrpg') {
      if (!target) return reply(`💔 Marque alguém para abraçar!`);
      if (target === sender) return reply(`💔 Você não pode se abraçar!`);
      const actions = [
        `${pushname} deu um abraço caloroso em @${target.split('@')[0]}! 🤗`,
        `${pushname} abraçou @${target.split('@')[0]} com muito carinho! 💕`,
        `Um abraço apertado de ${pushname} para @${target.split('@')[0]}! 🫂`
      ];
      return reply(actions[Math.floor(Math.random() * actions.length)], { mentions: [target] });
    }

    // --- BEIJAR ---
    if (command === 'beijarrpg' || command === 'kissrpg') {
      if (!target) return reply(`💔 Marque alguém para beijar!`);
      if (target === sender) return reply(`💔 Você não pode se beijar!`);
      const actions = [
        `${pushname} deu um beijo em @${target.split('@')[0]}! 😘`,
        `${pushname} beijou @${target.split('@')[0]} apaixonadamente! 💋`
      ];
      return reply(actions[Math.floor(Math.random() * actions.length)], { mentions: [target] });
    }

    // --- BATER ---
    if (command === 'baterrpg' || command === 'taparpg' || command === 'slaprpg') {
      if (!target) return reply(`💔 Marque alguém para dar um tapa!`);
      if (target === sender) return reply(`💔 Você não pode bater em si mesmo!`);
      const actions = [
        `${pushname} deu um tapa em @${target.split('@')[0]}! 👋💥`,
        `PAH! ${pushname} acertou @${target.split('@')[0]} em cheio! 😤`
      ];
      return reply(actions[Math.floor(Math.random() * actions.length)], { mentions: [target] });
    }

    // --- PROTEGER ---
    if (command === 'proteger' || command === 'protect') {
      if (!target) return reply(`💔 Marque alguém para proteger!`);
      if (target === sender) return reply(`💔 Você não pode se proteger assim!`);
      
      const protectCost = 2000;
      if (me.wallet < protectCost) return reply(`💰 Você precisa de ${protectCost.toLocaleString()} moedas!`);
      
      me.wallet -= protectCost;
      const targetData = getEcoUser(econ, target);
      if (!targetData.protection) targetData.protection = {};
      targetData.protection.protectedBy = sender;
      targetData.protection.until = Date.now() + 3600000; // 1 hora
      
      saveEconomy(econ);
      return reply(`🛡️ ${pushname} está protegendo @${target.split('@')[0]} por 1 hora!`, { mentions: [target] });
    }

    // --- REPUTAÇÃO ---
    if (command === 'reputacao' || command === 'rep' || command === 'reputation') {
      if (!me.reputation) me.reputation = { points: 0, upvotes: 0, downvotes: 0, karma: 0, fame: 0 };
      
      let text = `╭━━━⊱ ⭐ *REPUTAÇÃO* ⊱━━━╮\n│ ${pushname}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `⭐ Pontos: ${me.reputation.points}\n`;
      text += `👍 Votos Positivos: ${me.reputation.upvotes}\n`;
      text += `👎 Votos Negativos: ${me.reputation.downvotes}\n`;
      text += `☯️ Karma: ${me.reputation.karma}\n`;
      text += `🌟 Fama: ${me.reputation.fame}\n\n`;
      
      const repLevel = Math.floor(me.reputation.points / 100);
      const ranks = ['Novato', 'Conhecido', 'Respeitado', 'Famoso', 'Lendário'];
      text += `🏅 Classificação: *${ranks[Math.min(repLevel, ranks.length - 1)]}*\n\n`;
      text += `💡 Use ${prefix}votar @user para dar reputação`;
      
      return reply(text);
    }

    // --- VOTAR ---
    if (command === 'votar' || command === 'vote') {
      if (!target) return reply(`💔 Marque alguém para votar!`);
      if (target === sender) return reply(`💔 Você não pode votar em si mesmo!`);
      
      if (!me.lastVote) me.lastVote = {};
      const now = Date.now();
      if (me.lastVote[target] && (now - me.lastVote[target]) < 86400000) {
        return reply(`⏰ Você já votou nesta pessoa hoje! Aguarde ${timeLeft(me.lastVote[target] + 86400000)}.`);
      }
      
      const targetData = getEcoUser(econ, target);
      if (!targetData.reputation) targetData.reputation = { points: 0, upvotes: 0, downvotes: 0, karma: 0, fame: 0 };
      
      targetData.reputation.points += 10;
      targetData.reputation.upvotes++;
      targetData.reputation.karma += 5;
      targetData.reputation.fame++;
      
      me.lastVote[target] = now;
      saveEconomy(econ);
      return reply(`👍 ${pushname} deu reputação para @${target.split('@')[0]}!`, { mentions: [target] });
    }
  }
};
