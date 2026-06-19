
export default {
  name: "familia",
  description: "Sistema de família e adoção",
  commands: ["adotarfilho", "adotaruser", "arvore", "deserdar", "desherdar", "familia", "family", "familytree", "removerfilho"],
  usage: "{prefix}familia",
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
    if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
    
    // --- VER FAMÍLIA ---
    if (command === 'familia' || command === 'family') {
      let text = MESSAGES.rpg.family.myFamilyHeader(pushname);
      
      // Relacionamento do relationshipManager
      const activePair = relationshipManager?.getActivePairForUser(sender);
      if (activePair && activePair.partnerId) {
        let relationshipEmoji = activePair.pair?.status === 'casamento' ? '💍' : 
                          activePair.pair?.status === 'namoro' ? '💞' : '🎈';
        let relationshipType = activePair.pair?.status === 'casamento' ? 'Cônjuge' :
                         activePair.pair?.status === 'namoro' ? 'Namorado(a)' : 'Parceiro(a)';
        
        const since = activePair.pair?.stages?.[activePair.pair.status]?.since;
        const sinceDate = since ? new Date(since).toLocaleDateString() : 'Data desconhecida';
        
        text += MESSAGES.rpg.family.relationship(relationshipEmoji, relationshipType, activePair.partnerId.split('@')[0], sinceDate);
      } else {
        text += MESSAGES.rpg.family.single;
      }
      
      // Pais
      if (me.family.parents && me.family.parents.length > 0) {
        text += MESSAGES.rpg.family.parentsHeader;
        me.family.parents.forEach(parent => {
          text += MESSAGES.rpg.family.listItemDot(parent.split('@')[0]);
        });
        text += `\n`;
      }
      
      // Filhos
      if (me.family.children && me.family.children.length > 0) {
        text += MESSAGES.rpg.family.childrenHeader(me.family.children.length);
        me.family.children.forEach((child, i) => {
          text += MESSAGES.rpg.family.listItemNum(i + 1, child.split('@')[0]);
        });
        text += `\n`;
      } else {
        text += MESSAGES.rpg.family.noChildren;
      }
      
      // Irmãos
      if (me.family.siblings && me.family.siblings.length > 0) {
        text += MESSAGES.rpg.family.siblingsHeader(me.family.siblings.length);
        me.family.siblings.forEach(sibling => {
          text += MESSAGES.rpg.family.listItemDot(sibling.split('@')[0]);
        });
        text += `\n`;
      }
      
      text += MESSAGES.rpg.family.helpFooter(prefix);
      
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
      if (!target) return reply(MESSAGES.rpg.family.adoptNeedMention(prefix));
      if (target === sender) return reply(MESSAGES.rpg.family.adoptSelf);
      
      const targetUser = getEcoUser(econ, target);
      if (!targetUser.family) targetUser.family = { spouse: null, children: [], parents: [], siblings: [] };
      
      if (me.family.children?.includes(target)) return reply(MESSAGES.rpg.family.adoptAlreadyChild);
      if (targetUser.family.parents?.length >= 2) return reply(MESSAGES.rpg.family.adoptAlreadyParents);
      
      const adoptCost = 10000;
      if (me.wallet < adoptCost) return reply(MESSAGES.rpg.family.adoptNeedMoney(adoptCost.toLocaleString()));
      
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
      return reply(MESSAGES.rpg.family.adoptSuccess(pushname, target.split('@')[0], adoptCost.toLocaleString()), { mentions: [target] });
    }

    // --- DESERDAR ---
    if (command === 'deserdar' || command === 'desherdar' || command === 'removerfilho') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(MESSAGES.rpg.family.disownNeedMention(prefix));
      
      if (!me.family.children?.includes(target)) return reply(MESSAGES.rpg.family.disownNotChild);
      
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
      return reply(MESSAGES.rpg.family.disownSuccess(pushname, target.split('@')[0]), { mentions: [target] });
    }

    // --- ÁRVORE GENEALÓGICA ---
    if (command === 'arvore' || command === 'familytree') {
      let text = MESSAGES.rpg.family.treeHeader;
      
      const grandparents = [];
      if (me.family.parents) {
        for (const parent of me.family.parents) {
          const pData = getEcoUser(econ, parent);
          if (pData.family?.parents) grandparents.push(...pData.family.parents);
        }
      }
      
      if (grandparents.length > 0) {
        text += MESSAGES.rpg.family.treeGrandparents;
        [...new Set(grandparents)].forEach(gp => text += MESSAGES.rpg.family.listItemDot(gp.split('@')[0]));
        text += `\n`;
      }
      
      if (me.family.parents?.length > 0) {
        text += MESSAGES.rpg.family.treeParents;
        me.family.parents.forEach(p => text += MESSAGES.rpg.family.listItemDot(p.split('@')[0]));
        text += `\n`;
      }
      
      text += MESSAGES.rpg.family.treeYou(pushname);
      const activePair = relationshipManager?.getActivePairForUser(sender);
      if (activePair && activePair.partnerId) {
        text += MESSAGES.rpg.family.treePartner(activePair.partnerId.split('@')[0]);
      }
      text += `\n`;
      
      if (me.family.children?.length > 0) {
        text += MESSAGES.rpg.family.treeChildren;
        me.family.children.forEach(c => text += MESSAGES.rpg.family.listItemDot(c.split('@')[0]));
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
        text += MESSAGES.rpg.family.treeGrandchildren;
        grandchildren.forEach(gc => text += MESSAGES.rpg.family.listItemDot(gc.split('@')[0]));
        text += `\n`;
      }
      
      const mentions = [...grandparents, ...(me.family.parents || []), ...(me.family.children || []), ...grandchildren];
      if (activePair?.partnerId) mentions.push(activePair.partnerId);
      
      return reply(text, { mentions: [...new Set(mentions)] });
    }
  }
};
