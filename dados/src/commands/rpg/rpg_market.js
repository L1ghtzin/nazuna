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
            if (items.length === 0) return reply('🛒 O mercado está vazio. Use listar para anunciar algo.');
            let text = '🛒 Mercado (ofertas abertas)\n\n';
            for (const ofr of items) {
                text += `#${ofr.id} • ${ofr.type === 'item' ? `${ofr.key} x${ofr.qty}` : `${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)} | Vendedor: @${ofr.seller.split('@')[0]}\n`;
            }
            return reply(text, { mentions: (items.map(i => i.seller)) });
        }

        if (sub === 'listar') {
            const kind = (args[0] || '').toLowerCase();
            if (!['item', 'mat', 'material'].includes(kind)) return reply(`Use: ${prefix}listar item <key> <qtd> <preco> | ${prefix}listar mat <material> <qtd> <preco>`);
            const qty = parseInt(args[2]); 
            const price = parseInt(args[3]);
            if (!isFinite(qty) || qty <= 0 || !isFinite(price) || price <= 0) return reply(`💔 Quantidade e preço inválidos.`);

            if (kind === 'item') {
                const key = (args[1] || '').toLowerCase();
                if ((me.inventory?.[key] || 0) < qty) return reply(`💔 Você não possui itens suficientes.`);
                me.inventory[key] -= qty;
                const id = econ.marketCounter++;
                econ.market.push({ id, type: 'item', key, qty, price, seller: sender });
                saveEconomy(econ);
                return reply(`📢 Anúncio #${id} criado: ${key} x${qty} por ${fmt(price)}.`);
            } else {
                const mat = (args[1] || '').toLowerCase();
                if ((me.materials?.[mat] || 0) < qty) return reply(`💔 Você não possui materiais suficientes.`);
                me.materials[mat] -= qty;
                const id = econ.marketCounter++;
                econ.market.push({ id, type: 'mat', mat, qty, price, seller: sender });
                saveEconomy(econ);
                return reply(`📢 Anúncio #${id} criado: ${mat} x${qty} por ${fmt(price)}.`);
            }
        }

        if (sub === 'meusanuncios' || sub === 'meusan') {
            const mine = (econ.market || []).filter(o => o.seller === sender);
            if (mine.length === 0) return reply('📭 Você não tem anúncios.');
            let text = '📋 Seus anúncios\n\n';
            for (const ofr of mine) text += `#${ofr.id} • ${ofr.type === 'item' ? `${ofr.key} x${ofr.qty}` : `${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)}\n`;
            return reply(text);
        }

        if (sub === 'cancelar') {
            const id = parseInt(args[0]); 
            if (!isFinite(id)) return reply(`💔 Informe o ID do anúncio.`);
            const idx = (econ.market || []).findIndex(o => o.id === id);
            if (idx < 0) return reply(`💔 Anúncio não encontrado.`);
            const ofr = econ.market[idx];
            if (ofr.seller !== sender) return reply(`💔 Apenas o vendedor pode cancelar.`);
            
            if (ofr.type === 'item') me.inventory[ofr.key] = (me.inventory[ofr.key] || 0) + ofr.qty; 
            else me.materials[ofr.mat] = (me.materials[ofr.mat] || 0) + ofr.qty;
            
            econ.market.splice(idx, 1);
            saveEconomy(econ);
            return reply(`💔 Anúncio #${id} cancelado e itens devolvidos.`);
        }

        if (sub === 'comprarmercado' || sub === 'cmerc') {
            const id = parseInt(args[0]); 
            if (!isFinite(id)) return reply(`💔 Informe o ID do anúncio.`);
            const ofr = (econ.market || []).find(o => o.id === id);
            if (!ofr) return reply(`💔 Anúncio não encontrado.`);
            if (ofr.seller === sender) return reply(`💔 Você não pode comprar seu próprio anúncio.`);
            
            if (me.wallet < ofr.price) return reply('💰 Saldo insuficiente.');
            const tax = Math.floor(ofr.price * 0.05);
            const seller = getEcoUser(econ, ofr.seller);
            
            me.wallet -= ofr.price;
            seller.wallet += (ofr.price - tax);
            
            if (ofr.type === 'item') me.inventory[ofr.key] = (me.inventory[ofr.key] || 0) + ofr.qty; 
            else me.materials[ofr.mat] = (me.materials[ofr.mat] || 0) + ofr.qty;
            
            econ.market = econ.market.filter(o => o.id !== id);
            saveEconomy(econ);
            return reply(`🛒 Compra realizada! Taxa de ${fmt(tax)} aplicada. Vendedor @${ofr.seller.split('@')[0]} recebeu ${fmt(ofr.price - tax)}.`, { mentions: [ofr.seller] });
        }
    }
};
