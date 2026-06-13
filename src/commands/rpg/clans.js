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
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));

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
      if (!q) return reply(MESSAGES.rpg.clans.createUsage(prefix));
      if (me.clan) return reply(MESSAGES.rpg.clans.alreadyInClan);

      const clanName = q.trim();
      if (clanName.length < 3 || clanName.length > 24) return reply(MESSAGES.rpg.clans.invalidNameLen);

      const baseNormalized = normalizeClanName(clanName);
      const nameTaken = Object.values(econ.clans || {}).some(c => c.name && normalizeClanName(c.name) === baseNormalized);
      if (nameTaken) return reply(MESSAGES.rpg.clans.nameTaken);

      const clanCost = 20000;
      if ((me.wallet || 0) < clanCost) return reply(MESSAGES.rpg.clans.createCost(clanCost.toLocaleString()));

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
      return reply(MESSAGES.rpg.clans.created(clanName, pushname, clanCost.toLocaleString()));
    }

    // --- MEU CLÃ / INFO CLÃ ---
    if (command === 'meucla' || command === 'meuclã' || command === 'cla' || command === 'claninfo') {
      let clanObj = null;
      if (!q) {
        if (!me.clan) return reply(MESSAGES.rpg.clans.notInClan(prefix));
        clanObj = econ.clans[me.clan];
        if (!clanObj) { me.clan = null; saveEconomy(econ); return reply(MESSAGES.rpg.clanNotFound); }
      } else {
        const qTrim = q.trim();
        const qLower = qTrim.toLowerCase();
        clanObj = econ.clans[qTrim] || Object.values(econ.clans || {}).find(c => (c.id && c.id.toLowerCase() === qLower) || (c.name && normalizeClanName(c.name) === qLower));
      }

      if (!clanObj) {
        return reply(MESSAGES.rpg.clans.noClanCatalog(prefix));
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
      if (!clan) return reply(MESSAGES.rpg.clans.notInClan(prefix));

      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return reply(MESSAGES.rpg.clans.depositUsage(prefix));
      if (me.wallet < amount) return reply(MESSAGES.rpg.clans.noMoney);

      me.wallet -= amount;
      clan.bank = (clan.bank || 0) + amount;
      
      saveEconomy(econ);
      return reply(MESSAGES.rpg.clans.deposited(amount.toLocaleString(), clan.bank.toLocaleString()));
    }

    // --- GUERRA ---
    if (command === 'guerra' || command === 'war' || command === 'guerracla') {
      const clan = getMyClan();
      if (!clan) return reply(MESSAGES.rpg.clans.needClanWar);
      if (clan.leader !== sender) return reply(MESSAGES.rpg.clans.leaderOnlyWar);
      
      let text = `╭━━━⊱ ⚔️ *GUERRA DE CLÃS* ⊱━━━╮\n│ Seu Clã: *${clan.name}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `💡 Em breve: Sistema de guerras entre clãs!\n\n`;
      text += `🏆 Recursos:\n• Batalhas estratégicas\n• Território conquistável\n• Recompensas épicas\n• Rankings de clãs\n\n`;
      text += `⏰ Sistema em desenvolvimento...`;
      return reply(text);
    }

    // --- CONVIDAR ---
    if (command === 'convidar' || command === 'invite' || command === 'convite') {
      const clan = getMyClan();
      if (!clan) return reply(MESSAGES.rpg.clans.notInClan(prefix));
      if (clan.leader !== sender) return reply(MESSAGES.rpg.clans.leaderOnlyInvite);

      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(MESSAGES.rpg.clans.inviteUsage(prefix));
      
      const rawTargetJid = target;
      target = await normalizeUserId(bot, target);
      if (target === sender) return reply(MESSAGES.rpg.clans.inviteSelf);

      const targetUser = getEcoUser(econ, target);
      if (targetUser.clan) return reply(MESSAGES.rpg.clans.targetInClan);

      if (!Array.isArray(clan.pendingInvites)) clan.pendingInvites = [];
      if (idInList(target, clan.pendingInvites)) return reply(MESSAGES.rpg.clans.invitePending);

      clan.pendingInvites.push(target);
      saveEconomy(econ);
      
      await reply(MESSAGES.rpg.clans.invited(rawTargetJid.split('@')[0], prefix, clan.id), { mentions: [rawTargetJid] });
      return;
    }

    // --- ACEITAR CONVITE ---
    if (command === 'aceitarconvite' || command === 'aceitarrpg') {
      const rawJid = getRawJid();
      const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && (idInList(sender, c.pendingInvites) || idInList(rawJid, c.pendingInvites)));
      if (!q && clansWithInvite.length === 0) return reply(MESSAGES.rpg.clans.acceptNoInvites);
      
      let clanObj = null;
      if (!q) {
        if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
        else return reply(MESSAGES.rpg.clans.acceptMultiple(prefix));
      } else {
        const qTrim = q.trim();
        const qLower = qTrim.toLowerCase();
        clanObj = econ.clans[qTrim] || Object.values(econ.clans || {}).find(c => (c.id && c.id.toLowerCase() === qLower) || (c.name && c.name.toLowerCase() === qLower));
      }

      if (!clanObj || !Array.isArray(clanObj.pendingInvites) || (!idInList(sender, clanObj.pendingInvites) && !idInList(rawJid, clanObj.pendingInvites))) {
        return reply(MESSAGES.rpg.clans.acceptNotFound);
      }

      if (me.clan) return reply(MESSAGES.rpg.clans.acceptAlreadyIn);

      clanObj.members = clanObj.members || [];
      if (!clanObj.members.includes(sender)) clanObj.members.push(sender);
      clanObj.pendingInvites = removeIdFromList(sender, clanObj.pendingInvites);
      clanObj.pendingInvites = removeIdFromList(rawJid, clanObj.pendingInvites);
      me.clan = clanObj.id;
      
      saveEconomy(econ);
      return reply(MESSAGES.rpg.clans.accepted(clanObj.name));
    }

    // --- RECUSAR CONVITE ---
    if (command === 'recusarconvite' || command === 'recusar') {
      const rawJid = getRawJid();
      const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && (idInList(sender, c.pendingInvites) || idInList(rawJid, c.pendingInvites)));
      if (!q && clansWithInvite.length === 0) return reply(MESSAGES.rpg.clans.rejectNoInvites);

      let clanObj = null;
      if (!q) {
        if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
        else return reply(MESSAGES.rpg.clans.rejectMultiple(prefix));
      } else {
        const qTrim = q.trim();
        const qLower = qTrim.toLowerCase();
        clanObj = econ.clans[qTrim] || Object.values(econ.clans || {}).find(c => (c.id && c.id.toLowerCase() === qLower) || (c.name && c.name.toLowerCase() === qLower));
      }

      if (!clanObj || !Array.isArray(clanObj.pendingInvites) || (!idInList(sender, clanObj.pendingInvites) && !idInList(rawJid, clanObj.pendingInvites))) {
        return reply(MESSAGES.rpg.clans.rejectNotFound);
      }

      clanObj.pendingInvites = removeIdFromList(sender, clanObj.pendingInvites);
      clanObj.pendingInvites = removeIdFromList(rawJid, clanObj.pendingInvites);
      saveEconomy(econ);
      return reply(MESSAGES.rpg.clans.rejected(clanObj.name));
    }

    // --- EXPULSAR ---
    if (command === 'expulsar' || command === 'kickcla') {
      const clan = getMyClan();
      if (!clan) return reply(MESSAGES.rpg.clans.notInClan(prefix));
      if (clan.leader !== sender) return reply(MESSAGES.rpg.clans.leaderOnlyKick);

      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(MESSAGES.rpg.clans.kickUsage(prefix));
      
      const rawTargetJid = target;
      target = await normalizeUserId(bot, target);
      if (target === sender) return reply(MESSAGES.rpg.clans.kickSelf);

      if (!idInList(target, clan.members)) return reply(MESSAGES.rpg.clans.kickNotMember);

      clan.members = removeIdFromList(target, clan.members);
      const targetUser = getEcoUser(econ, target);
      if (targetUser.clan === clan.id) targetUser.clan = null;
      
      for (const [k, c] of Object.entries(econ.clans || {})) {
        if (Array.isArray(c.pendingInvites)) {
          c.pendingInvites = removeIdFromList(target, c.pendingInvites);
        }
      }

      saveEconomy(econ);
      return reply(MESSAGES.rpg.clans.kicked(rawTargetJid.split('@')[0], clan.name), { mentions: [rawTargetJid] });
    }

    // --- SAIR DO CLÃ ---
    if (command === 'sair') {
      const clan = getMyClan();
      if (!clan) return reply(MESSAGES.rpg.clans.notInClan(prefix));
      
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
          return reply(MESSAGES.rpg.clans.dissolved);
        } else {
          const newLeader = remaining[0];
          clan.leader = newLeader;
          clan.members = remaining;
          me.clan = null;
          saveEconomy(econ);
          return reply(MESSAGES.rpg.clans.leaveLeaderTransfer(newLeader.split('@')[0]), { mentions: [newLeader] });
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
      return reply(MESSAGES.rpg.clans.left);
    }

    // --- REMOVER CONVITE ---
    if (command === 'rmconvite' || command === 'removerconvite') {
      const clan = getMyClan();
      if (!clan) return reply(MESSAGES.rpg.clans.notInClan(prefix));
      if (clan.leader !== sender) return reply(MESSAGES.rpg.clans.leaderOnlyRemoveInvite);

      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(MESSAGES.rpg.clans.removeInviteUsage(prefix));
      
      const rawTargetJid = target;
      target = await normalizeUserId(bot, target);
      
      if (!Array.isArray(clan.pendingInvites) || !idInList(target, clan.pendingInvites)) return reply(MESSAGES.rpg.clans.removeInviteNoPending);

      clan.pendingInvites = removeIdFromList(target, clan.pendingInvites);
      saveEconomy(econ);
      return reply(MESSAGES.rpg.clans.removeInviteSuccess(rawTargetJid.split('@')[0]), { mentions: [rawTargetJid] });
    }

    // --- RANK CLÃS ---
    if (command === 'rankcla' || command === 'rankclã') {
      const allClans = Object.values(econ.clans || {});
      if (allClans.length === 0) return reply(MESSAGES.rpg.clans.noClans);

      const ranked = allClans.sort((a, b) => (b.level || 1) - (a.level || 1) || (b.exp || 0) - (a.exp || 0)).slice(0, 10);
      let text = `╭━━━⊱ 🏆 *TOP CLÃS* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      ranked.forEach((c, i) => {
        text += `${i + 1}. *${c.name}*\n   📊 Nível: ${c.level || 1} | 👥 ${c.members?.length || 0} membros\n\n`;
      });
      return reply(text);
    }
  }
};
