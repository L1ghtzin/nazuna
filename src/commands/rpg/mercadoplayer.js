
export default {
  name: "mercadoplayer",
  description: "Mercado de itens entre jogadores",
  commands: ["mercadoplayer", "auction", "leilaoplayer"],
  usage: "{prefix}mercadoplayer [comprar/vender/meus/cancelar]",
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
    parseAmount,
    fmt,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    if (!econ.playerMarket) econ.playerMarket = { listings: [], fee: 0.05 }; // 5% taxa

    const sub = args[0]?.toLowerCase();

    // Listar itens à venda
    if (!sub || sub === 'ver') {
      const listings = econ.playerMarket.listings.filter(l => l.seller !== sender);
      
      let text = MESSAGES.rpg.playerMarket.header(econ.playerMarket.fee * 100);
      
      if (listings.length === 0) {
        text += MESSAGES.rpg.playerMarket.empty;
      } else {
        text += MESSAGES.rpg.playerMarket.itemsHeader;
        listings.slice(0, 15).forEach((item, i) => {
          text += MESSAGES.rpg.playerMarket.itemLine(i + 1, item.name, item.enchant, fmt(item.price), item.seller.split('@')[0]);
        });
      }
      
      text += MESSAGES.rpg.playerMarket.commandsHelp(prefix);
      
      return reply(text, { mentions: listings.map(l => l.seller) });
    }

    // Vender item
    if (sub === 'vender') {
      const itemName = args[1];
      const preco = parseAmount(args[2], 999999999999);
      
      if (!itemName || isNaN(preco) || preco < 100) {
        return reply(MESSAGES.rpg.playerMarket.sellUsage(prefix));
      }
      
      if (!me.inventory || !me.inventory[itemName] || me.inventory[itemName] <= 0) {
        return reply(MESSAGES.rpg.playerMarket.noItem);
      }
      
      // Verificar limite de anúncios
      const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
      if (meusAnuncios.length >= 5) {
        return reply(MESSAGES.rpg.playerMarket.maxListings);
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
      return reply(MESSAGES.rpg.playerMarket.sellSuccess(itemName, fmt(preco), econ.playerMarket.fee * 100));
    }

    // Comprar item
    if (sub === 'comprar') {
      const index = parseInt(args[1]) - 1;
      const listings = econ.playerMarket.listings.filter(l => l.seller !== sender);
      
      if (isNaN(index) || index < 0 || index >= listings.length) {
        return reply(MESSAGES.rpg.playerMarket.invalidNumber);
      }
      
      const listing = listings[index];
      
      if (me.wallet < listing.price) {
        return reply(MESSAGES.rpg.playerMarket.needMoney(fmt(listing.price)));
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
      return reply(MESSAGES.rpg.playerMarket.buySuccess(listing.name, fmt(listing.price), listing.seller.split('@')[0], fmt(valorLiquido)), {
        mentions: [listing.seller]
      });
    }

    // Meus anúncios
    if (sub === 'meus') {
      const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
      
      if (meusAnuncios.length === 0) {
        return reply(MESSAGES.rpg.playerMarket.myAdsEmpty);
      }
      
      let text = MESSAGES.rpg.playerMarket.myAdsHeader;
      meusAnuncios.forEach((item, i) => {
        text += MESSAGES.rpg.playerMarket.myAdsItemLine(i + 1, item.name, fmt(item.price));
      });
      
      text += MESSAGES.rpg.playerMarket.myAdsFooter(prefix);
      
      return reply(text);
    }

    // Cancelar anúncio
    if (sub === 'cancelar') {
      const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
      const index = parseInt(args[1]) - 1;
      
      if (isNaN(index) || index < 0 || index >= meusAnuncios.length) {
        return reply(MESSAGES.rpg.playerMarket.invalidCancelNumber);
      }
      
      const listing = meusAnuncios[index];
      
      // Devolver item
      if (!me.inventory) me.inventory = {};
      me.inventory[listing.name] = (me.inventory[listing.name] || 0) + 1;
      
      // Remover do mercado
      econ.playerMarket.listings = econ.playerMarket.listings.filter(l => l.id !== listing.id);
      
      saveEconomy(econ);
      return reply(MESSAGES.rpg.playerMarket.cancelSuccess(listing.name));
    }

    return reply(MESSAGES.rpg.playerMarket.help(prefix));
  }
};
