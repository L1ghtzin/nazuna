import { PREFIX } from "../../config.js";

export default {
  name: "economy",
  description: "Comandos básicos de economia (trabalhar, minerar, roubar)",
  commands: ["assaltar", "banco", "cacar", "carteira", "crime", "depositar", "emprego", "explorar", "explore", "fish", "hunt", "mine", "minerar", "pescar", "roubar", "sacar", "trabalhar", "transferir", "vagas", "work"],
  usage: `${PREFIX}trabalhar`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    args,
    mentioned,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    // --- TRABALHAR ---
    if (command === 'trabalhar' || command === 'work') {
      const reward = 500 + Math.floor(Math.random() * 500);
      me.wallet += reward;
      saveEconomy(econ);
      return reply(`💼 Você trabalhou e recebeu ${reward.toLocaleString()} moedas!`);
    }

    // --- EMPREGO ---
    if (command === 'emprego' || command === 'vagas') {
      return reply('💼 Em breve: Sistema de empregos e carreiras!');
    }

    // --- MINERAR ---
    if (command === 'minerar' || command === 'mine') {
      const reward = 300 + Math.floor(Math.random() * 300);
      me.wallet += reward;
      saveEconomy(econ);
      return reply(`⛏️ Você minerou e recebeu ${reward.toLocaleString()} moedas!`);
    }

    // --- PESCAR ---
    if (command === 'pescar' || command === 'fish') {
      const reward = 200 + Math.floor(Math.random() * 200);
      me.wallet += reward;
      saveEconomy(econ);
      return reply(`🎣 Você pescou e recebeu ${reward.toLocaleString()} moedas!`);
    }

    // --- EXPLORAR ---
    if (command === 'explorar' || command === 'explore') {
      const reward = 400 + Math.floor(Math.random() * 400);
      me.wallet += reward;
      saveEconomy(econ);
      return reply(`🧭 Você explorou e recebeu ${reward.toLocaleString()} moedas!`);
    }

    // --- CAÇAR ---
    if (command === 'cacar' || command === 'hunt') {
      const reward = 350 + Math.floor(Math.random() * 350);
      me.wallet += reward;
      saveEconomy(econ);
      return reply(`🏹 Você caçou e recebeu ${reward.toLocaleString()} moedas!`);
    }

    // --- CRIME ---
    if (command === 'crime' || command === 'assaltar' || command === 'roubar' || command === 'rob') {
      return reply('🦹 Em breve: Sistema de crimes e assaltos!');
    }

    // --- SALDO ---
    if (command === 'saldo' || command === 'carteira' || command === 'wallet') {
      return reply(`💰 *SALDO* 💰\n\n👛 Carteira: ${me.wallet.toLocaleString()}\n🏦 Banco: ${me.bank.toLocaleString()}\n\n✨ Total: ${(me.wallet + me.bank).toLocaleString()}`);
    }
  }
};
