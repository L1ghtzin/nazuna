import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_materials",
    description: "Visualização e venda de materiais do RPG",
    commands: ["materiais", "precos", "preços", "sell", "vender"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        // Catalog of materials and prices if not in DB
        const materialPrices = econ.materialPrices || {
            pedra: 5, ferro: 15, ouro: 50, diamante: 200, esmeralda: 150,
            trigo: 10, cenoura: 15, batata: 15, tomate: 20, alface: 20,
            peixe: 30, carne: 40, madeira: 8, couro: 12
        };

        if (sub === 'materiais') {
            const mats = me.materials || {};
            if (Object.keys(mats).length === 0) return reply('📦 Você não possui materiais.');
            let text = '📦 *SEUS MATERIAIS*\n\n';
            for (const [k, v] of Object.entries(mats)) {
                if (v > 0) text += `• ${k}: ${v}\n`;
            }
            return reply(text);
        }

        if (sub === 'precos' || sub === 'preços') {
            let text = '⚖️ *TABELA DE PREÇOS (VENDA)*\n\n';
            for (const [k, v] of Object.entries(materialPrices)) {
                text += `• ${k}: ${fmt(v)}\n`;
            }
            return reply(text);
        }

        if (sub === 'vender') {
            const mat = (args[0] || '').toLowerCase();
            const qty = args[1] === 'all' ? (me.materials?.[mat] || 0) : parseInt(args[1]);
            
            if (!materialPrices[mat]) return reply(`💔 Material inválido. Use ${prefix}precos para ver a lista.`);
            if (!qty || isNaN(qty) || qty <= 0) return reply(`💔 Informe uma quantidade válida ou "all".`);
            if ((me.materials?.[mat] || 0) < qty) return reply(`💔 Você não possui ${qty}x ${mat}.`);

            const price = materialPrices[mat] * qty;
            me.materials[mat] -= qty;
            me.wallet += price;
            saveEconomy(econ);
            return reply(`💰 Você vendeu ${qty}x ${mat} por ${fmt(price)}.`);
        }
    }
};
