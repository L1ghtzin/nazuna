import { PREFIX } from "../../config.js";
import { normalizeClanName } from "../../utils/helpers.js";

export default {
  name: "clans",
  description: "Sistema de clãs do RPG",
  commands: ["aceitarconvite", "aceitarrpg", "cla", "claninfo", "convidar", "convite", "criarcla", "criarclã", "expulsar", "guerra", "guerracla", "invite", "recusarconvite", "removerconvite", "rmconvite", "sair", "war"],
  usage: `${PREFIX}cla`,
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
    menc_jid2,
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
    if (command === 'meucla' || command === 'meuclã' || (command === 'cla' && !args[0])) {
      if (!me.clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      const clan = econ.clans[me.clan];
      if (!clan) {
        me.clan = null;
        saveEconomy(econ);
        return reply(`💔 Seu clã não foi encontrado.`);
      }

      let text = `╭━━━⊱ 🏰 *${clan.name.toUpperCase()}* ⊱━━━╮\n`;
      text += `│ 👑 Líder: @${clan.leader.split('@')[0]}\n`;
      text += `│ 📊 Nível: ${clan.level || 1}\n`;
      text += `│ ✨ EXP: ${clan.exp || 0}\n`;
      text += `│ 💰 Banco: ${(clan.bank || 0).toLocaleString()}\n`;
      text += `│ 👥 Membros: ${clan.members?.length || 0}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `📜 *MEMBROS:*\n`;
      clan.members?.forEach((m, i) => {
        text += `${i + 1}. @${m.split('@')[0]}${m === clan.leader ? ' 👑' : ''}\n`;
      });

      return reply(text, { mentions: clan.members });
    }

    // --- GUERRA ---
    if (command === 'guerra' || command === 'war' || command === 'guerracla') {
      if (!me.clan) return reply('🏰 Você precisa estar em um clã para declarar guerra!');
      const myClan = econ.clans[me.clan];
      if (myClan.leader !== sender) return reply('👑 Apenas o líder pode declarar guerra!');
      
      let text = `╭━━━⊱ ⚔️ *GUERRA DE CLÃS* ⊱━━━╮\n│ Seu Clã: *${myClan.name}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `💡 Em breve: Sistema de guerras entre clãs!\n\n`;
      text += `🏆 Recursos:\n• Batalhas estratégicas\n• Território conquistável\n• Recompensas épicas\n• Rankings de clãs\n\n`;
      text += `⏰ Sistema em desenvolvimento...`;
      return reply(text);
    }

    // --- CONVIDAR ---
    if (command === 'convidar') {
      if (!me.clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      const clan = econ.clans[me.clan];
      if (clan.leader !== sender) return reply('👑 Apenas o líder pode convidar membros.');

      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`❗ Marque um usuário para convidar. Ex: ${prefix}convidar @user`);
      if (target === sender) return reply(`💔 Você já está no clã!`);

      const targetUser = getEcoUser(econ, target);
      if (targetUser.clan) return reply(`💔 Este usuário já pertence a um clã.`);

      if (!Array.isArray(clan.pendingInvites)) clan.pendingInvites = [];
      if (clan.pendingInvites.includes(target)) return reply(`💔 Este usuário já tem um convite pendente.`);

      clan.pendingInvites.push(target);
      saveEconomy(econ);
      
      await reply(`📨 Convite enviado para @${target.split('@')[0]}!\nUse ${prefix}aceitarconvite ${clan.id} para aceitar.`, { mentions: [target] });
      return;
    }

    // --- ACEITAR CONVITE ---
    if (command === 'aceitarconvite' || command === 'aceitarrpg') {
      const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && c.pendingInvites.includes(sender));
      if (!q && clansWithInvite.length === 0) return reply(`💔 Você não possui convites pendentes para clãs.`);
      
      let clanObj = null;
      if (!q) {
        if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
        else return reply(`🔎 Você possui múltiplos convites. Use: ${prefix}aceitarconvite <clanId>`);
      } else {
        const qLower = q.trim().toLowerCase();
        clanObj = econ.clans[q] || Object.values(econ.clans || {}).find(c => (c.name || '').toLowerCase() === qLower);
      }

      if (!clanObj || !Array.isArray(clanObj.pendingInvites) || !clanObj.pendingInvites.includes(sender)) {
        return reply(`💔 Clã não encontrado ou sem convite pendente.`);
      }

      if (me.clan) return reply(`💔 Você já faz parte de um clã. Saia do atual primeiro.`);

      clanObj.members = clanObj.members || [];
      if (!clanObj.members.includes(sender)) clanObj.members.push(sender);
      clanObj.pendingInvites = clanObj.pendingInvites.filter(id => id !== sender);
      me.clan = clanObj.id;
      
      saveEconomy(econ);
      return reply(`✅ Você entrou para o clã *${clanObj.name}*!`);
    }

    // --- RECUSAR CONVITE ---
    if (command === 'recusarconvite') {
      const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && c.pendingInvites.includes(sender));
      if (!q && clansWithInvite.length === 0) return reply(`💔 Você não possui convites pendentes para clãs.`);

      let clanObj = null;
      if (!q) {
        if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
        else return reply(`🔎 Você possui múltiplos convites. Use: ${prefix}recusarconvite <clanId>`);
      } else {
        const qLower = q.trim().toLowerCase();
        clanObj = econ.clans[q] || Object.values(econ.clans || {}).find(c => (c.name || '').toLowerCase() === qLower);
      }

      if (!clanObj || !Array.isArray(clanObj.pendingInvites) || !clanObj.pendingInvites.includes(sender)) {
        return reply(`💔 Clã não encontrado ou sem convite pendente.`);
      }

      clanObj.pendingInvites = clanObj.pendingInvites.filter(id => id !== sender);
      saveEconomy(econ);
      return reply(`❗ Você recusou o convite do clã *${clanObj.name}*.`);
    }

    // --- EXPULSAR ---
    if (command === 'expulsar') {
      if (!me.clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      const clan = econ.clans[me.clan];
      if (clan.leader !== sender) return reply('👑 Apenas o líder pode expulsar membros.');

      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`❗ Marque um membro para expulsar. Ex: ${prefix}expulsar @user`);
      if (target === sender) return reply(`💔 Você não pode se expulsar. Use sair para transferir liderança.`);

      if (!clan.members.includes(target)) return reply(`💔 Este usuário não é membro do seu clã.`);

      clan.members = clan.members.filter(m => m !== target);
      const targetUser = getEcoUser(econ, target);
      if (targetUser.clan === clan.id) targetUser.clan = null;
      
      saveEconomy(econ);
      return reply(`🗑️ @${target.split('@')[0]} foi expulso do clã *${clan.name}*.`, { mentions: [target] });
    }

    // --- SAIR DO CLÃ ---
    if (command === 'sair') {
      if (!me.clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      const clan = econ.clans[me.clan];
      
      if (clan.leader === sender) {
        const remaining = clan.members.filter(m => m !== sender);
        if (remaining.length === 0) {
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

      clan.members = clan.members.filter(m => m !== sender);
      me.clan = null;
      saveEconomy(econ);
      return reply('✅ Você saiu do clã.');
    }

    // --- REMOVER CONVITE ---
    if (command === 'rmconvite' || command === 'removerconvite') {
      if (!me.clan) return reply(`💔 Você não faz parte de nenhum clã.`);
      const clan = econ.clans[me.clan];
      if (clan.leader !== sender) return reply('👑 Apenas o líder pode remover convites.');

      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`❗ Marque um usuário para remover o convite. Ex: ${prefix}rmconvite @user`);
      
      if (!Array.isArray(clan.pendingInvites) || !clan.pendingInvites.includes(target)) return reply(`💔 Este usuário não tem um convite pendente.`);

      clan.pendingInvites = clan.pendingInvites.filter(id => id !== target);
      saveEconomy(econ);
      return reply(`🗑️ Convite removido para @${target.split('@')[0]}.`, { mentions: [target] });
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
