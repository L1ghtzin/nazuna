import { PREFIX } from "../../config.js";

export default {
  name: "mercadoplayer",
  description: "Mercado de itens entre jogadores",
  commands: ["mercadoplayer", "auction", "leilaoplayer"],
  usage: `${PREFIX}mercadoplayer [comprar/vender/meus/cancelar]`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    args, 
    prefix, 
    pushname, 
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    if (!econ.playerMarket) econ.playerMarket = { listings: [], fee: 0.05 }; // 5% taxa

    const sub = args[0]?.toLowerCase();

    // Listar itens à venda
    if (!sub || sub === 'ver') {
      const listings = econ.playerMarket.listings.filter(l => l.seller !== sender);
      
      let text = `╭━━━⊱ 🛒 *MERCADO DE JOGADORES* ⊱━━━╮\n`;
      text += `│ Taxa: ${econ.playerMarket.fee * 100}% por venda\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      
      if (listings.length === 0) {
        text += `📦 Nenhum item à venda no momento!\n\n`;
      } else {
        text += `📦 *ITENS À VENDA:*\n\n`;
        listings.slice(0, 15).forEach((item, i) => {
          text += `${i + 1}. *${item.name}* ${item.enchant ? `+${item.enchant}` : ''}\n`;
          text += `   💰 ${item.price.toLocaleString()} | 👤 @${item.seller.split('@')[0]}\n`;
        });
      }
      
      text += `\n💡 *Comandos:*\n`;
      text += `• ${prefix}mercadoplayer vender <item> <preço>\n`;
      text += `• ${prefix}mercadoplayer comprar <nº>\n`;
      text += `• ${prefix}mercadoplayer meus`;
      
      return reply(text, { mentions: listings.map(l => l.seller) });
    }

    // Vender item
    if (sub === 'vender') {
      const itemName = args[1];
      const preco = parseInt(args[2]);
      
      if (!itemName || !preco || preco < 100) {
        return reply(`💡 Use: ${prefix}mercadoplayer vender <item> <preço>\n\n⚠️ Preço mínimo: 100`);
      }
      
      if (!me.inventory || !me.inventory[itemName] || me.inventory[itemName] <= 0) {
        return reply(`💔 Você não tem este item!`);
      }
      
      // Verificar limite de anúncios
      const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
      if (meusAnuncios.length >= 5) {
        return reply(`💔 Você já tem 5 itens à venda! Cancele algum primeiro.`);
      }
      
      me.inventory[itemName]--;
      
      econ.playerMarket.listings.push({
        id: `listing_${Date.now()}`,
        name: itemName,
        price: preco,
        seller: sender,
        sellerName: pushname,
        created: Date.now()
      });
      
      saveEconomy(econ);
      return reply(`✅ *ITEM LISTADO*\n\n📦 ${itemName}\n💰 ${preco.toLocaleString()}\n\n⚠️ Taxa de ${econ.playerMarket.fee * 100}% será cobrada na venda`);
    }

    // Comprar item
    if (sub === 'comprar') {
      const index = parseInt(args[1]) - 1;
      const listings = econ.playerMarket.listings.filter(l => l.seller !== sender);
      
      if (isNaN(index) || index < 0 || index >= listings.length) {
        return reply(`💔 Número inválido! Use o número da lista.`);
      }
      
      const listing = listings[index];
      
      if (me.wallet < listing.price) {
        return reply(`💰 Você precisa de ${listing.price.toLocaleString()}!`);
      }
      
      // Processar compra
      me.wallet -= listing.price;
      if (!me.inventory) me.inventory = {};
      me.inventory[listing.name] = (me.inventory[listing.name] || 0) + 1;
      
      // Pagar vendedor (menos taxa)
      const vendedor = getEcoUser(econ, listing.seller);
      const valorLiquido = Math.floor(listing.price * (1 - econ.playerMarket.fee));
      vendedor.wallet += valorLiquido;
      
      // Remover do mercado
      econ.playerMarket.listings = econ.playerMarket.listings.filter(l => l.id !== listing.id);
      
      saveEconomy(econ);
      return reply(`✅ *COMPRA REALIZADA*\n\n📦 ${listing.name}\n💰 -${listing.price.toLocaleString()}\n\n📬 Vendedor @${listing.seller.split('@')[0]} recebeu ${valorLiquido.toLocaleString()}`, {
        mentions: [listing.seller]
      });
    }

    // Meus anúncios
    if (sub === 'meus') {
      const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
      
      if (meusAnuncios.length === 0) {
        return reply('📦 Você não tem nenhum item à venda!');
      }
      
      let text = `🛒 *SEUS ANÚNCIOS*\n\n`;
      meusAnuncios.forEach((item, i) => {
        text += `${i + 1}. *${item.name}*\n`;
        text += `   💰 ${item.price.toLocaleString()}\n\n`;
      });
      
      text += `💡 Use ${prefix}mercadoplayer cancelar <nº> para cancelar`;
      
      return reply(text);
    }

    // Cancelar anúncio
    if (sub === 'cancelar') {
      const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
      const index = parseInt(args[1]) - 1;
      
      if (isNaN(index) || index < 0 || index >= meusAnuncios.length) {
        return reply(`💔 Número inválido!`);
      }
      
      const listing = meusAnuncios[index];
      
      // Devolver item
      if (!me.inventory) me.inventory = {};
      me.inventory[listing.name] = (me.inventory[listing.name] || 0) + 1;
      
      // Remover do mercado
      econ.playerMarket.listings = econ.playerMarket.listings.filter(l => l.id !== listing.id);
      
      saveEconomy(econ);
      return reply(`✅ Anúncio cancelado! ${listing.name} devolvido ao inventário.`);
    }

    return reply(`💡 Use ${prefix}mercadoplayer para ver comandos`);
  }
};
