import { giveMaterial } from "../../utils/database.js";

export default {
  name: "properties",
  description: "Sistema de propriedades e negócios",
  commands: ["coletarpropriedades", "comprarpropriedade", "propriedades", "cprop", "cprops"],
  usage: "{prefix}propriedades",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

    if (command === 'propriedades' || command === 'cprops') {
      const keys = Object.keys(econ.propertiesCatalog || {});
      let text = '🏠 Propriedades disponíveis\n\n';
      
      for (const k of keys) {
        const p = econ.propertiesCatalog[k];
        const upkeep = p.upkeepPerDay || 0; 
        const incGold = p.incomeGoldPerDay || 0; 
        const incMat = p.incomeMaterialsPerDay || {};
        const mats = Object.entries(incMat).map(([mk, mq]) => `${mk} x${mq}/dia`).join(', ');
        
        text += `  ${k} - ${p.name} - Preço: ${fmt(p.price)} - Manutenção: ${fmt(upkeep)}/dia - Renda: ${incGold > 0 ? `${fmt(incGold)} gold/dia` : ''}${mats ? `${incGold > 0 ? ' e ' : ''}${mats}` : ''}\n`;
      }
      
      // minhas propriedades
      const mine = me.properties || {}; 
      const owned = Object.keys(mine).filter(k => mine[k]?.owned);
      
      if (owned.length > 0) {
        text += '\n🏢 Suas propriedades:\n';
        for (const k of owned) {
          const o = mine[k];
          const last = o.lastCollect ? new Date(o.lastCollect).toLocaleDateString('pt-BR') : '-';
          text += `  ${econ.propertiesCatalog[k]?.name || k} - desde ${last}\n`;
        }
      }
      
      text += `\n💡 Use ${prefix}comprarpropriedade <tipo> e ${prefix}coletarpropriedades`;
      return reply(text);
    }
    
    if (command === 'comprarpropriedade' || command === 'cprop') {
      const key = (args[0] || '').toLowerCase(); 
      if (!key) return reply(`Use: ${prefix}comprarpropriedade <tipo>`);
      
      const prop = (econ.propertiesCatalog || {})[key]; 
      if (!prop) return reply('Propriedade inexistente.');
      
      if (me.properties?.[key]?.owned) return reply('Você já possui essa propriedade.');
      if ((me.wallet || 0) < prop.price) return reply('Saldo insuficiente.');
      
      me.wallet -= prop.price;
      if (!me.properties) me.properties = {};
      me.properties[key] = { owned: true, lastCollect: Date.now() };
      
      saveEconomy(econ);
      return reply(`✅ Você comprou ${prop.name}!`);
    }
    
    if (command === 'coletarpropriedades') {
      const props = me.properties || {}; 
      const keys = Object.keys(props).filter(k => props[k].owned);
      
      if (keys.length === 0) return reply('Você não possui propriedades.');
      
      let totalGold = 0; 
      const matsGain = {};
      
      for (const k of keys) {
        const meta = (econ.propertiesCatalog || {})[k]; 
        if (!meta) continue;
        
        const days = Math.max(1, Math.floor((Date.now() - (props[k].lastCollect || Date.now())) / (24 * 60 * 60 * 1000)));
        const upkeep = (meta.upkeepPerDay || 0) * days; 
        
        if ((me.wallet || 0) < upkeep) {
          return reply(`Saldo insuficiente para pagar manutenção de ${meta.name} (${fmt(upkeep)}).`);
        }
        
        me.wallet -= upkeep;
        
        if (meta.incomeGoldPerDay) totalGold += meta.incomeGoldPerDay * days;
        if (meta.incomeMaterialsPerDay) {
          for (const [mk, mq] of Object.entries(meta.incomeMaterialsPerDay)) {
            matsGain[mk] = (matsGain[mk] || 0) + (mq * days);
          }
        }
        
        props[k].lastCollect = Date.now();
      }
      
      me.wallet += totalGold;
      for (const [mk, mq] of Object.entries(matsGain)) {
        giveMaterial(me, mk, mq);
      }
      
      saveEconomy(econ);
      
      let msg = `✅ Coleta concluída! +${fmt(totalGold)} gold`;
      if (Object.keys(matsGain).length > 0) {
        msg += ` | Materiais: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ');
      }
      
      return reply(msg);
    }
  }
};
