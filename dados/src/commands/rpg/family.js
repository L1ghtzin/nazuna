import { PREFIX } from "../../config.js";

export default {
  name: "familia",
  description: "Sistema de família e adoção",
  commands: ["adotarfilho", "adotaruser", "arvore", "deserdar", "desherdar", "familia", "family", "familytree", "removerfilho"],
  usage: `${PREFIX}familia`,
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
    relationshipManager,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
    
    // --- VER FAMÍLIA ---
    if (command === 'familia' || command === 'family') {
      let text = `╭━━━⊱ 👨‍👩‍👧‍👦 *MINHA FAMÍLIA* ⊱━━━╮\n`;
      text += `│ ${pushname}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      
      // Relacionamento do relationshipManager
      const activePair = relationshipManager?.getActivePairForUser(sender);
      if (activePair && activePair.partnerId) {
        let relationshipEmoji = activePair.pair?.status === 'casamento' ? '💍' : 
                          activePair.pair?.status === 'namoro' ? '💞' : '🎈';
        let relationshipType = activePair.pair?.status === 'casamento' ? 'Cônjuge' :
                         activePair.pair?.status === 'namoro' ? 'Namorado(a)' : 'Parceiro(a)';
        
        const since = activePair.pair?.stages?.[activePair.pair.status]?.since;
        const sinceDate = since ? new Date(since).toLocaleDateString() : 'Data desconhecida';
        
        text += `${relationshipEmoji} *${relationshipType}:*\n`;
        text += `┌─────────────────\n`;
        text += `│ @${activePair.partnerId.split('@')[0]}\n`;
        text += `│ ❤️ Desde: ${sinceDate}\n`;
        text += `└─────────────────\n\n`;
      } else {
        text += `💔 *Relacionamento:* Solteiro(a)\n\n`;
      }
      
      // Pais
      if (me.family.parents && me.family.parents.length > 0) {
        text += `👫 *Pais:*\n`;
        me.family.parents.forEach(parent => {
          text += `• @${parent.split('@')[0]}\n`;
        });
        text += `\n`;
      }
      
      // Filhos
      if (me.family.children && me.family.children.length > 0) {
        text += `👶 *Filhos (${me.family.children.length}):*\n`;
        me.family.children.forEach((child, i) => {
          text += `${i + 1}. @${child.split('@')[0]}\n`;
        });
        text += `\n`;
      } else {
        text += `👶 *Filhos:* Nenhum\n\n`;
      }
      
      // Irmãos
      if (me.family.siblings && me.family.siblings.length > 0) {
        text += `👫 *Irmãos (${me.family.siblings.length}):*\n`;
        me.family.siblings.forEach(sibling => {
          text += `• @${sibling.split('@')[0]}\n`;
        });
        text += `\n`;
      }
      
      text += `💡 Use ${prefix}adotaruser @user para adotar\n`;
      text += `💡 Use ${prefix}arvore para ver árvore genealógica`;
      
      const mentions = [
        ...(me.family.parents || []),
        ...(me.family.children || []),
        ...(me.family.siblings || [])
      ].filter(Boolean);
      
      if (activePair?.partnerId) mentions.push(activePair.partnerId);
      
      return reply(text, { mentions: [...new Set(mentions)] });
    }

    // --- ADOTAR ---
    if (command === 'adotaruser' || command === 'adotarfilho') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`💔 Marque alguém para adotar!\n\n💡 Exemplo: ${prefix}adotaruser @user`);
      if (target === sender) return reply(`💔 Você não pode se adotar!`);
      
      const targetUser = getEcoUser(econ, target);
      if (!targetUser.family) targetUser.family = { spouse: null, children: [], parents: [], siblings: [] };
      
      if (me.family.children?.includes(target)) return reply(`💔 Esta pessoa já é seu filho(a)!`);
      if (targetUser.family.parents?.length >= 2) return reply(`💔 Esta pessoa já tem 2 pais/mães!`);
      
      const adoptCost = 10000;
      if (me.wallet < adoptCost) return reply(`💰 Você precisa de ${adoptCost.toLocaleString()} moedas para adotar!`);
      
      me.wallet -= adoptCost;
      if (!me.family.children) me.family.children = [];
      me.family.children.push(target);
      
      if (!targetUser.family.parents) targetUser.family.parents = [];
      targetUser.family.parents.push(sender);
      
      // Se tiver parceiro, adotar também
      const activePair = relationshipManager?.getActivePairForUser(sender);
      if (activePair && activePair.partnerId) {
        const spouseData = getEcoUser(econ, activePair.partnerId);
        if (!spouseData.family) spouseData.family = { spouse: null, children: [], parents: [], siblings: [] };
        if (!spouseData.family.children) spouseData.family.children = [];
        spouseData.family.children.push(target);
        targetUser.family.parents.push(activePair.partnerId);
      }
      
      saveEconomy(econ);
      return reply(`🎉 Parabéns! ${pushname} adotou @${target.split('@')[0]}!\n💰 Custo: ${adoptCost.toLocaleString()}`, { mentions: [target] });
    }

    // --- DESERDAR ---
    if (command === 'deserdar' || command === 'desherdar' || command === 'removerfilho') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`💔 Marque alguém para deserdar!\n\n💡 Exemplo: ${prefix}deserdar @user`);
      
      if (!me.family.children?.includes(target)) return reply(`💔 Esta pessoa não é seu filho(a)!`);
      
      me.family.children = me.family.children.filter(child => child !== target);
      const targetUser = getEcoUser(econ, target);
      if (targetUser.family?.parents) {
        targetUser.family.parents = targetUser.family.parents.filter(parent => parent !== sender);
      }
      
      // Remover do parceiro também
      const activePair = relationshipManager?.getActivePairForUser(sender);
      if (activePair && activePair.partnerId) {
        const spouseData = getEcoUser(econ, activePair.partnerId);
        if (spouseData.family?.children) {
          spouseData.family.children = spouseData.family.children.filter(child => child !== target);
        }
        if (targetUser.family?.parents) {
          targetUser.family.parents = targetUser.family.parents.filter(parent => parent !== activePair.partnerId);
        }
      }
      
      saveEconomy(econ);
      return reply(`😢 ${pushname} deserdou @${target.split('@')[0]}!`, { mentions: [target] });
    }

    // --- ÁRVORE GENEALÓGICA ---
    if (command === 'arvore' || command === 'familytree') {
      let text = `╭━━━⊱ 🌳 *ÁRVORE GENEALÓGICA* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      
      const grandparents = [];
      if (me.family.parents) {
        for (const parent of me.family.parents) {
          const pData = getEcoUser(econ, parent);
          if (pData.family?.parents) grandparents.push(...pData.family.parents);
        }
      }
      
      if (grandparents.length > 0) {
        text += `👴👵 *Avós:*\n`;
        [...new Set(grandparents)].forEach(gp => text += `• @${gp.split('@')[0]}\n`);
        text += `\n`;
      }
      
      if (me.family.parents?.length > 0) {
        text += `👫 *Pais:*\n`;
        me.family.parents.forEach(p => text += `• @${p.split('@')[0]}\n`);
        text += `\n`;
      }
      
      text += `👤 *Você:* ${pushname}\n`;
      const activePair = relationshipManager?.getActivePairForUser(sender);
      if (activePair && activePair.partnerId) {
        text += `💍 *Parceiro(a):* @${activePair.partnerId.split('@')[0]}\n`;
      }
      text += `\n`;
      
      if (me.family.children?.length > 0) {
        text += `👶 *Filhos:*\n`;
        me.family.children.forEach(c => text += `• @${c.split('@')[0]}\n`);
        text += `\n`;
      }
      
      const grandchildren = [];
      if (me.family.children) {
        for (const child of me.family.children) {
          const cData = getEcoUser(econ, child);
          if (cData.family?.children) grandchildren.push(...cData.family.children);
        }
      }
      
      if (grandchildren.length > 0) {
        text += `👶👶 *Netos:*\n`;
        grandchildren.forEach(gc => text += `• @${gc.split('@')[0]}\n`);
        text += `\n`;
      }
      
      const mentions = [...grandparents, ...(me.family.parents || []), ...(me.family.children || []), ...grandchildren];
      if (activePair?.partnerId) mentions.push(activePair.partnerId);
      
      return reply(text, { mentions: [...new Set(mentions)] });
    }
  }
};
