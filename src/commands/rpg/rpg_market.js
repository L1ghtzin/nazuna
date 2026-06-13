import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    fmt,
    getUserName
} from "../../utils/database.js";

export default {
    name: "rpg_market",
    description: "Sistema de mercado entre usuários do RPG",
    commands: ["mercado", "listar", "meusanuncios", "meusan", "cancelar", "comprarmercado", "cmerc"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        if (sub === 'mercado') {
            const items = econ.market || [];
            if (items.length === 0) return reply(MESSAGES.rpg.market.empty);
            let text = '🛒 Mercado (ofertas abertas)\n\n';
            for (const ofr of items) {
                text += `#${ofr.id} • ${ofr.type === 'item' ? `${ofr.key} x${ofr.qty}` : `${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)} | Vendedor: @${ofr.seller.split('@')[0]}\n`;
            }
            return reply(text, { mentions: (items.map(i => i.seller)) });
        }

        if (sub === 'listar') {
            const kind = (args[0] || '').toLowerCase();
            if (!['item', 'mat', 'material'].includes(kind)) return reply(MESSAGES.rpg.market.useList(prefix));
            const qty = parseInt(args[2]); 
            const price = parseInt(args[3]);
            if (!isFinite(qty) || qty <= 0 || !isFinite(price) || price <= 0) return reply(MESSAGES.rpg.market.invalidQtyPrice);

            if (kind === 'item') {
                const key = (args[1] || '').toLowerCase();
                if ((me.inventory?.[key] || 0) < qty) return reply(MESSAGES.rpg.market.notEnoughItems);
                me.inventory[key] -= qty;
                const id = econ.marketCounter++;
                econ.market.push({ id, type: 'item', key, qty, price, seller: sender });
                saveEconomy(econ);
                return reply(MESSAGES.rpg.market.listSuccess(id, key, qty, fmt(price)));
            } else {
                const mat = (args[1] || '').toLowerCase();
                if ((me.materials?.[mat] || 0) < qty) return reply(MESSAGES.rpg.market.notEnoughMaterials);
                me.materials[mat] -= qty;
                const id = econ.marketCounter++;
                econ.market.push({ id, type: 'mat', mat, qty, price, seller: sender });
                saveEconomy(econ);
                return reply(MESSAGES.rpg.market.listSuccess(id, mat, qty, fmt(price)));
            }
        }

        if (sub === 'meusanuncios' || sub === 'meusan') {
            const mine = (econ.market || []).filter(o => o.seller === sender);
            if (mine.length === 0) return reply(MESSAGES.rpg.market.noOffers);
            let text = '📋 Seus anúncios\n\n';
            for (const ofr of mine) text += `#${ofr.id} • ${ofr.type === 'item' ? `${ofr.key} x${ofr.qty}` : `${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)}\n`;
            return reply(text);
        }

        if (sub === 'cancelar') {
            const id = parseInt(args[0]); 
            if (!isFinite(id)) return reply(MESSAGES.rpg.market.missingId);
            const idx = (econ.market || []).findIndex(o => o.id === id);
            if (idx < 0) return reply(MESSAGES.rpg.market.notFound);
            const ofr = econ.market[idx];
            if (ofr.seller !== sender) return reply(MESSAGES.rpg.market.cancelOnlySeller);
            
            if (ofr.type === 'item') me.inventory[ofr.key] = (me.inventory[ofr.key] || 0) + ofr.qty; 
            else me.materials[ofr.mat] = (me.materials[ofr.mat] || 0) + ofr.qty;
            
            econ.market.splice(idx, 1);
            saveEconomy(econ);
            return reply(MESSAGES.rpg.market.cancelSuccess(id));
        }

        if (sub === 'comprarmercado' || sub === 'cmerc') {
            const id = parseInt(args[0]); 
            if (!isFinite(id)) return reply(MESSAGES.rpg.market.missingId);
            const ofr = (econ.market || []).find(o => o.id === id);
            if (!ofr) return reply(MESSAGES.rpg.market.notFound);
            if (ofr.seller === sender) return reply(MESSAGES.rpg.market.buyOwnError);
            
            if (me.wallet < ofr.price) return reply(MESSAGES.rpg.insufficientCoins(ofr.price.toLocaleString('pt-BR')));
            const tax = Math.floor(ofr.price * 0.05);
            const seller = getEcoUser(econ, ofr.seller);
            
            me.wallet -= ofr.price;
            seller.wallet += (ofr.price - tax);
            
            if (ofr.type === 'item') me.inventory[ofr.key] = (me.inventory[ofr.key] || 0) + ofr.qty; 
            else me.materials[ofr.mat] = (me.materials[ofr.mat] || 0) + ofr.qty;
            
            econ.market = econ.market.filter(o => o.id !== id);
            saveEconomy(econ);
            return reply(MESSAGES.rpg.market.buySuccess(fmt(tax), fmt(ofr.price - tax), ofr.seller.split('@')[0]), { mentions: [ofr.seller] });
        }
    }
};
