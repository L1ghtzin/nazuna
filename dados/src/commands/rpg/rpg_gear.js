import { 
    loadEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    recalcEquipmentBonuses
} from "../../utils/database.js";

export default {
    name: "rpg_gear",
    description: "Visualização de equipamentos do RPG",
    commands: ["equipamentos", "gear", "equip"],
    handle: async ({ 
    reply, isGroup, groupData, sender, pushname,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        
        if (!me.equipment) me.equipment = { weapon: null, armor: null, helmet: null, boots: null, shield: null, accessory: null };
        
        recalcEquipmentBonuses(me, econ.shop);

        let text = `╭━━━⊱ ⚔️ *EQUIPAMENTOS* ⊱━━━╮\n│ 👤 Aventureiro: *${pushname}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `🗡️ *Arma:* ${me.equipment.weapon || `💔 Nenhuma`}\n`;
        text += `🛡️ *Armadura:* ${me.equipment.armor || `💔 Nenhuma`}\n`;
        text += `⛑️ *Capacete:* ${me.equipment.helmet || `💔 Nenhum`}\n`;
        text += `👢 *Botas:* ${me.equipment.boots || `💔 Nenhuma`}\n`;
        text += `🛡️ *Escudo:* ${me.equipment.shield || `💔 Nenhum`}\n`;
        text += `💍 *Acessório:* ${me.equipment.accessory || `💔 Nenhum`}\n\n`;
        text += `╭━━━⊱ 📊 *ESTATÍSTICAS* ⊱━━━╮\n`;
        text += `│ ⚔️ Poder de Ataque: +${me.attackBonus || 0}\n`;
        text += `│ 🛡️ Poder de Defesa: +${me.defenseBonus || 0}\n`;
        text += `│ ✨ Poder Total: ${me.power || 100}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯`;
        
        return reply(text);
    }
};
