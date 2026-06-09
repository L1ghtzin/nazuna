import { normalizeClanName, normalizeUserId } from "../../utils/helpers.js";

export default {
  name: "clans",
  description: "Sistema de clãs do RPG",
  commands: ["aceitarconvite", "aceitarrpg", "cla", "claninfo", "convidar", "convite", "criarcla", "criarclã", "depositarcla", "depcla", "expulsar", "guerra", "guerracla", "invite", "kickcla", "meucla", "meuclã", "recusar", "recusarconvite", "removerconvite", "rmconvite", "sair", "war", "rankcla", "rankclã"],
  usage: "{prefix}cla",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    q, 
    args,
    command,
    info,
    menc_jid2,
    isGroupAdmin,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES,
    bot
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    // Helper: busca o JID bruto do remetente (para retrocompatibilidade JID/LID)
    const getRawJid = () => info?.key?.participant || info?.message?.participant || sender;

    const idInList = (id, list) => {
      if (!Array.isArray(list) || !id || typeof id !== 'string') return false;
      if (list.includes(id)) return true;
      const base = id.split('@')[0];
      return list.some(item => typeof item === 'string' && item.split('@')[0] === base);
    };

    const removeIdFromList = (id, list) => {
      if (!Array.isArray(list) || !id || typeof id !== 'string') return list || [];
      const base = id.split('@')[0];
      return list.filter(item => typeof item === 'string' && item.split('@')[0] !== base);
    };

    // Helper: guard de clã inexistente
    const getMyClan = () => {
      if (!me.clan) return null;
      const clan = econ.clans[me.clan];
      if (!clan) {
        me.clan = null;
        saveEconomy(econ);
        return null;
      }
      return clan;
    };

    // --- CRIAR CLÃ ---
    if (command === 'criarcla' || command === 'criarclã') {
      if (!q) return reply(`❗ Use: ${prefix}criarcla <nome do clã>`);
      if (me.clan) return reply(`💔 Você já pertence a um clã!`);

      const clanName = q.trim();
      if (clanName.length < 3 || clanName.length > 24) return reply(`💔 Nome do clã precisa ter entre 3 e 24 caracteres.`);

      const baseNormalized = normalizeClanName(clanName);
      const nameTaken = Object.values(econ.clans || {}).some(c => c.name && normalizeClanName(c.name) === baseNormalized);
      if (nameTaken) return reply(`💔 Já existe um clã com esse nome!`);

      const clanCost = 20000;
      if ((me.wallet || 0) < clanCost) return reply(`💰 Você precisa de ${clanCost.toLocaleString()} moedas para criar um clã.`);

      me.wallet -= clanCost;
      const clanId = 'CLAN_' + Date.now();
      
      if (!econ.clans) econ.clans = {};
      econ.clans[clanId] = {
        id: clanId,
        name: clanName,
        leader: sender,
        members: [sender],
        level: 1,
        exp: 0,
        bank: 0,
        pendingInvites: [],
        created: Date.now()
      };
      
      me.clan = clanId;
      saveEconomy(econ);
      return reply(`🏰 Clã *${clanName}* criado com sucesso!\n\n👑 Líder: ${pushname}\n💰 Custo: ${clanCost.toLocaleString()}`);
    }

    // --- MEU CLÃ / INFO CLÃ ---
    if (command === 'meucla' || command === 'meuclã' || command === 'cla' || command === 'claninfo') {
      let clanObj = null;
      if (!q) {
        if (!me.clan) return reply(`💔 Você não faz parte de nenhum clã. Use: ${prefix}cla <nome do clã> para consultar outro clã.`);
        clanObj = econ.clans[me.clan];
        if (!clanObj) { me.clan = null; saveEconomy(econ); return reply(MESSAGES.rpg.clanNotFound); }
      } else {
        const qTrim = q.trim();
        const qLower = qTrim.toLowerCase();
        clanObj = econ.clans[qTrim] || Object.values(econ.clans || {}).find(c => (c.id && c.id.toLowerCase() === qLower) || (c.name && normalizeClanName(c.name) === qLower));
      }

      if (!clanObj) {
        return reply(`💔 Clã não encontrado. Use ${prefix}criarcla <nome> para criar o seu!`);
      }

      let text = `╭━━━⊱ 🏰 *${clanObj.name.toUpperCase()}* ⊱━━━╮\n`;
      text += `│ 🆔 ID: ${clanObj.id}\n`;
      text += `│ 👑 Líder: @${clanObj.leader.split('@')[0]}\n`;
      text += `│ 📊 Nível: ${clanObj.level || 1}\n`;
      text += `│ ✨ EXP: ${clanObj.exp || 0}\n`;
      text += `│ 💰 Banco: ${(clanObj.bank || 0).toLocaleString()}\n`;
      text += `│ 👥 Membros: ${clanObj.members?.length || 0}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `📜 *MEMBROS:*\n`;
      
      const mentions = [];
      clanObj.members?.forEach((m, i) => {
        mentions.push(m);
        text += `${i + 1}. @${m.split('@')[0]}${m === clanObj.leader ? ' 👑' : ''}\n`;
      });

      if (Array.isArray(clanObj.pendingInvites) && clanObj.pendingInvites.length > 0) {
        text += `\n📨 *CONVITES PENDENTES:*\n`;
        clanObj.pendingInvites.forEach(m => {
          mentions.push(m);
          text += `• @${m.split('@')[0]}\n`;
        });
      }

      return reply(text, { mentions });
    }

    // --- DEPOSITAR NO CLÃ ---
    if (command === 'depositarcla' || command === 'depcla') {
      const clan = getMyClan();
      if (!clan) return reply(`💔 Você não faz parte de nenhum clã.`);

      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return reply(`💔 Informe um valor válido para depositar! Ex: ${prefix}depositarcla 5000`);
      if (me.wallet < amount) return reply(`💰 Você não tem moedas suficientes na carteira!`);

      me.wallet -= amount;
      clan.bank = (clan.bank || 0) + amount;
      
      saveEconomy(econ);
      return reply(`🏰 Você depositou *${amount.toLocaleString()}* moedas no banco do clã!\n💰 Banco atual: *${clan.bank.toLocaleString()}* moedas.`);
    }

    // --- GUERRA ---
    if (command === 'guerra' || command === 'war' || command === 'guerracla') {
      const clan = getMyClan();
      if (!clan) return reply('🏰 Você precisa estar em um clã para declarar guerra!');
      if (clan.leader !== sender) return reply('👑 Apenas o líder pode declarar guerra!');
      
      let text = `╭━━━⊱ ⚔️ *GUERRA DE CLÃS* ⊱━━━╮\n│ Seu Clã: *${clan.name}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `💡 Em breve: Sistema de guerras entre clãs!\n\n`;
      text += `🏆 Recursos:\n• Batalhas estratégicas\n• Território conquistável\n• Recompensas épicas\n• Rankings de clãs\n\n`;
      text += `⏰ Sistema em desenvolvimento...`;
      return reply(text);
    }

    // --- CONVIDAR ---
    if (command === 'convidar' || command === 'invite' || command === 'convite') {
      const clan = getMyClan();
      if (!clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      if (clan.leader !== sender) return reply('👑 Apenas o líder pode convidar membros.');

      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`❗ Marque um usuário para convidar. Ex: ${prefix}convidar @user`);
      
      const rawTargetJid = target;
      target = await normalizeUserId(bot, target);
      if (target === sender) return reply(`💔 Você já está no clã!`);

      const targetUser = getEcoUser(econ, target);
      if (targetUser.clan) return reply(`💔 Este usuário já pertence a um clã.`);

      if (!Array.isArray(clan.pendingInvites)) clan.pendingInvites = [];
      if (idInList(target, clan.pendingInvites)) return reply(`💔 Este usuário já tem um convite pendente.`);

      clan.pendingInvites.push(target);
      saveEconomy(econ);
      
      await reply(`📨 Convite enviado para @${rawTargetJid.split('@')[0]}!\nUse ${prefix}aceitarconvite ${clan.id} para aceitar.`, { mentions: [rawTargetJid] });
      return;
    }

    // --- ACEITAR CONVITE ---
    if (command === 'aceitarconvite' || command === 'aceitarrpg') {
      const rawJid = getRawJid();
      const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && (idInList(sender, c.pendingInvites) || idInList(rawJid, c.pendingInvites)));
      if (!q && clansWithInvite.length === 0) return reply(`💔 Você não possui convites pendentes para clãs.`);
      
      let clanObj = null;
      if (!q) {
        if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
        else return reply(`🔎 Você possui múltiplos convites. Use: ${prefix}aceitarconvite <clanId>`);
      } else {
        const qTrim = q.trim();
        const qLower = qTrim.toLowerCase();
        clanObj = econ.clans[qTrim] || Object.values(econ.clans || {}).find(c => (c.id && c.id.toLowerCase() === qLower) || (c.name && c.name.toLowerCase() === qLower));
      }

      if (!clanObj || !Array.isArray(clanObj.pendingInvites) || (!idInList(sender, clanObj.pendingInvites) && !idInList(rawJid, clanObj.pendingInvites))) {
        return reply(`💔 Clã não encontrado ou sem convite pendente.`);
      }

      if (me.clan) return reply(`💔 Você já faz parte de um clã. Saia do atual primeiro.`);

      clanObj.members = clanObj.members || [];
      if (!clanObj.members.includes(sender)) clanObj.members.push(sender);
      clanObj.pendingInvites = removeIdFromList(sender, clanObj.pendingInvites);
      clanObj.pendingInvites = removeIdFromList(rawJid, clanObj.pendingInvites);
      me.clan = clanObj.id;
      
      saveEconomy(econ);
      return reply(`✅ Você entrou para o clã *${clanObj.name}*!`);
    }

    // --- RECUSAR CONVITE ---
    if (command === 'recusarconvite' || command === 'recusar') {
      const rawJid = getRawJid();
      const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && (idInList(sender, c.pendingInvites) || idInList(rawJid, c.pendingInvites)));
      if (!q && clansWithInvite.length === 0) return reply(`💔 Você não possui convites pendentes para clãs.`);

      let clanObj = null;
      if (!q) {
        if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
        else return reply(`🔎 Você possui múltiplos convites. Use: ${prefix}recusarconvite <clanId>`);
      } else {
        const qTrim = q.trim();
        const qLower = qTrim.toLowerCase();
        clanObj = econ.clans[qTrim] || Object.values(econ.clans || {}).find(c => (c.id && c.id.toLowerCase() === qLower) || (c.name && c.name.toLowerCase() === qLower));
      }

      if (!clanObj || !Array.isArray(clanObj.pendingInvites) || (!idInList(sender, clanObj.pendingInvites) && !idInList(rawJid, clanObj.pendingInvites))) {
        return reply(`💔 Clã não encontrado ou sem convite pendente.`);
      }

      clanObj.pendingInvites = removeIdFromList(sender, clanObj.pendingInvites);
      clanObj.pendingInvites = removeIdFromList(rawJid, clanObj.pendingInvites);
      saveEconomy(econ);
      return reply(`❗ Você recusou o convite do clã *${clanObj.name}*.`);
    }

    // --- EXPULSAR ---
    if (command === 'expulsar' || command === 'kickcla') {
      const clan = getMyClan();
      if (!clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      if (clan.leader !== sender) return reply('👑 Apenas o líder pode expulsar membros.');

      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`❗ Marque um membro para expulsar. Ex: ${prefix}expulsar @user`);
      
      const rawTargetJid = target;
      target = await normalizeUserId(bot, target);
      if (target === sender) return reply(`💔 Você não pode se expulsar. Use sair para transferir liderança.`);

      if (!idInList(target, clan.members)) return reply(`💔 Este usuário não é membro do seu clã.`);

      clan.members = removeIdFromList(target, clan.members);
      const targetUser = getEcoUser(econ, target);
      if (targetUser.clan === clan.id) targetUser.clan = null;
      
      for (const [k, c] of Object.entries(econ.clans || {})) {
        if (Array.isArray(c.pendingInvites)) {
          c.pendingInvites = removeIdFromList(target, c.pendingInvites);
        }
      }

      saveEconomy(econ);
      return reply(`🗑️ @${rawTargetJid.split('@')[0]} foi expulso do clã *${clan.name}*.`, { mentions: [rawTargetJid] });
    }

    // --- SAIR DO CLÃ ---
    if (command === 'sair') {
      const clan = getMyClan();
      if (!clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      
      const rawJid = getRawJid();

      if (clan.leader === sender) {
        const remaining = clan.members.filter(m => m !== sender && m.split('@')[0] !== sender.split('@')[0]);
        if (remaining.length === 0) {
          // Limpa referência do clã em todos os membros
          (clan.members || []).forEach(m => {
            const u = getEcoUser(econ, m);
            if (u.clan === clan.id) u.clan = null;
          });
          delete econ.clans[clan.id];
          me.clan = null;
          saveEconomy(econ);
          return reply('🗑️ Você saiu e o clã foi dissolvido pois não há mais membros.');
        } else {
          const newLeader = remaining[0];
          clan.leader = newLeader;
          clan.members = remaining;
          me.clan = null;
          saveEconomy(econ);
          return reply(`🔁 Você deixou o clã e a liderança foi transferida para @${newLeader.split('@')[0]}.`, { mentions: [newLeader] });
        }
      }

      clan.members = removeIdFromList(sender, clan.members);
      me.clan = null;
      
      for (const [k, c] of Object.entries(econ.clans || {})) {
        if (Array.isArray(c.pendingInvites)) {
          c.pendingInvites = removeIdFromList(sender, c.pendingInvites);
        }
      }
      
      saveEconomy(econ);
      return reply('✅ Você saiu do clã.');
    }

    // --- REMOVER CONVITE ---
    if (command === 'rmconvite' || command === 'removerconvite') {
      const clan = getMyClan();
      if (!clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      if (clan.leader !== sender) return reply('👑 Apenas o líder pode remover convites.');

      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`❗ Marque um usuário para remover o convite. Ex: ${prefix}rmconvite @user`);
      
      const rawTargetJid = target;
      target = await normalizeUserId(bot, target);
      
      if (!Array.isArray(clan.pendingInvites) || !idInList(target, clan.pendingInvites)) return reply(`💔 Este usuário não tem um convite pendente.`);

      clan.pendingInvites = removeIdFromList(target, clan.pendingInvites);
      saveEconomy(econ);
      return reply(`🗑️ Convite removido para @${rawTargetJid.split('@')[0]}.`, { mentions: [rawTargetJid] });
    }

    // --- RANK CLÃS ---
    if (command === 'rankcla' || command === 'rankclã') {
      const allClans = Object.values(econ.clans || {});
      if (allClans.length === 0) return reply('📊 Nenhum clã registrado.');

      const ranked = allClans.sort((a, b) => (b.level || 1) - (a.level || 1) || (b.exp || 0) - (a.exp || 0)).slice(0, 10);
      let text = `╭━━━⊱ 🏆 *TOP CLÃS* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      ranked.forEach((c, i) => {
        text += `${i + 1}. *${c.name}*\n   📊 Nível: ${c.level || 1} | 👥 ${c.members?.length || 0} membros\n\n`;
      });
      return reply(text);
    }
  }
};
