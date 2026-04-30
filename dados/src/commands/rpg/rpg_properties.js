import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    giveMaterial,
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_properties",
    description: "Sistema de propriedades e renda passiva do RPG",
    commands: ["propriedades", "comprarpropriedade", "cprop", "coletarpropriedades", "cprops"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        // Inicializa catálogo se não existir
        if (!econ.propertiesCatalog) {
            econ.propertiesCatalog = {
                fazenda: { name: '🚜 Fazenda', price: 50000, upkeepPerDay: 500, incomeGoldPerDay: 2000, incomeMaterialsPerDay: { trigo: 10 } },
                mina: { name: '⛏️ Mina Privada', price: 100000, upkeepPerDay: 1000, incomeGoldPerDay: 5000, incomeMaterialsPerDay: { pedra: 50, ferro: 10 } },
                mansao: { name: '🏰 Mansão', price: 500000, upkeepPerDay: 5000, incomeGoldPerDay: 0, incomeMaterialsPerDay: {} }
            };
            saveEconomy(econ);
        }

        if (sub === 'propriedades') {
            const keys = Object.keys(econ.propertiesCatalog);
            let text = '🏠 Propriedades disponíveis\n\n';
            for (const k of keys) {
                const p = econ.propertiesCatalog[k];
                const upkeep = p.upkeepPerDay || 0; 
                const incGold = p.incomeGoldPerDay || 0; 
                const incMat = p.incomeMaterialsPerDay || {};
                const mats = Object.entries(incMat).map(([mk, mq]) => `${mk} x${mq}/dia`).join(', ');
                text += `• ${k} — ${p.name}\n  💰 Preço: ${fmt(p.price)}\n  🛠️ Manutenção: ${fmt(upkeep)}/dia\n  💵 Renda: ${incGold > 0 ? `${fmt(incGold)} gold/dia` : ''}${mats ? `${incGold > 0 ? ' e ' : ''}${mats}` : ''}\n\n`;
            }

            const mine = me.properties || {}; 
            const owned = Object.keys(mine).filter(k => mine[k]?.owned);
            if (owned.length > 0) {
                text += '\n📦 Suas propriedades:\n';
                for (const k of owned) {
                    const o = mine[k];
                    const last = o.lastCollect ? new Date(o.lastCollect).toLocaleDateString('pt-BR') : '—';
                    text += `• ${econ.propertiesCatalog[k]?.name || k} — desde ${last}\n`;
                }
            }
            return reply(text);
        }

        if (sub === 'comprarpropriedade' || sub === 'cprop') {
            const key = (args[0] || '').toLowerCase(); 
            if (!key) return reply(`Use: ${prefix}comprarpropriedade <tipo>`);
            const prop = econ.propertiesCatalog[key]; 
            if (!prop) return reply(`💔 Propriedade inexistente.`);
            
            me.properties = me.properties || {};
            if (me.properties[key]?.owned) return reply(`💔 Você já possui essa propriedade.`);
            if (me.wallet < prop.price) return reply('💰 Saldo insuficiente.');
            
            me.wallet -= prop.price;
            me.properties[key] = { owned: true, lastCollect: Date.now() };
            saveEconomy(econ);
            return reply(`🏠 Você comprou ${prop.name}!`);
        }

        if (sub === 'coletarpropriedades' || sub === 'cprops') {
            const props = me.properties || {}; 
            const keys = Object.keys(props).filter(k => props[k].owned);
            if (keys.length === 0) return reply(`💔 Você não possui propriedades.`);

            let totalGold = 0; 
            const matsGain = {};
            const now = Date.now();

            for (const k of keys) {
                const meta = econ.propertiesCatalog[k]; 
                if (!meta) continue;
                const days = Math.max(1, Math.ceil((now - (props[k].lastCollect || now)) / (24 * 60 * 60 * 1000)));
                const upkeep = (meta.upkeepPerDay || 0) * days;
                
                if (me.wallet < upkeep) return reply(`💔 Saldo insuficiente para pagar manutenção de ${meta.name} (${fmt(upkeep)}).`);
                
                me.wallet -= upkeep;
                if (meta.incomeGoldPerDay) totalGold += meta.incomeGoldPerDay * days;
                if (meta.incomeMaterialsPerDay) {
                    for (const [mk, mq] of Object.entries(meta.incomeMaterialsPerDay)) {
                        matsGain[mk] = (matsGain[mk] || 0) + (mq * days);
                    }
                }
                props[k].lastCollect = now;
            }

            me.wallet += totalGold;
            for (const [mk, mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);
            saveEconomy(econ);

            let msg = `🏡 Coleta concluída! +${fmt(totalGold)} gold`;
            if (Object.keys(matsGain).length > 0) msg += ` | Materiais: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ');
            return reply(msg);
        }
    }
};
