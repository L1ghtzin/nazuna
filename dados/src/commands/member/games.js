export default {
  name: "games",
  description: "Comandos de Jogos",
  commands: ["achievements", "apostar", "assaltar", "banco", "bet", "buy", "c4", "cacar", "cancel", "cancelar", "cartas", "carteira", "caçar", "checktimeout", "cmerc", "coletar", "coletarpropriedades", "colher", "comer", "comprar", "comprarmercado", "comprarpropriedade", "connect4", "conquistas", "cook", "cozinhar", "cprop", "cprops", "create", "criar", "crime", "cultivar", "daily", "demitir", "dep", "depositar", "desafio", "desafiomensal", "desafiosemanal", "diario", "draw", "eat", "emprego", "entrar", "equip", "equipamentos", "explorar", "explore", "farm", "fish", "forge", "forjar", "gear", "habilidades", "hand", "harvest", "horta", "hunt", "ingredientes", "iniciar", "inv", "inventario", "jogodavelha", "join", "leave", "levels", "ligue4", "listar", "loja", "lojarps", "mao", "materiais", "medalhas", "memoria", "memory", "mercado", "meusan", "meusanuncios", "meuspets", "mine", "minerar", "parar", "perfilrpg", "pescar", "pets", "pix", "plant", "plantacao", "plantar", "plantação", "precos", "preços", "propriedades", "rankinglevel", "ranklevel", "ranklvl", "receitas", "reparar", "resetrpg", "roubar", "sacar", "sair", "saque", "sementes", "slots", "start", "status", "tictactoe", "toplevels", "toprpg", "trabalhar", "transferir", "ttt", "uno", "vagas", "vender", "vendercomida", "work"],
  handle: async ({ 
    nazu, from, info, command, args, reply, prefix, pushname, sender, menc_os2,
    isGroup, isGroupAdmin, tictactoe, connect4, uno, memoria, normalizeCommand,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    // ═══════════════════════════════════════════════════════════════
    // ❌ TIC TAC TOE (TTT)
    // ═══════════════════════════════════════════════════════════════
    if (['ttt', 'jogodavelha', 'tictactoe'].includes(cmd)) {
      if (!tictactoe) return reply("Sistema de Jogo da Velha indisponível.");
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      const result = await tictactoe.invitePlayer(from, sender, menc_os2);
      await nazu.sendMessage(from, { text: result.message, mentions: result.mentions });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔴 CONNECT 4
    // ═══════════════════════════════════════════════════════════════
    if (['connect4', 'c4', 'ligue4'].includes(cmd)) {
      if (!connect4) return reply("Sistema Connect4 indisponível.");
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      const result = await connect4.invitePlayer(from, sender, menc_os2);
      await nazu.sendMessage(from, { text: result.message, mentions: result.mentions });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎴 UNO
    // ═══════════════════════════════════════════════════════════════
    const unoCommands = ["uno", "criar", "create", "entrar", "join", "iniciar", "start", "sair", "leave", "cancelar", "cancel", "parar", "mao", "hand", "cartas", "comprar", "draw"];
    if (unoCommands.includes(cmd)) {
      if (!uno) return reply("Sistema UNO indisponível.");
      
      let subCmd = cmd === 'uno' ? normalizeCommand(args[0]) : cmd;
      if (!subCmd || subCmd === 'help') {
        return reply(`🎴 *UNO - Comandos*\n\n${prefix}uno criar\n${prefix}uno entrar\n${prefix}uno iniciar\n${prefix}uno jogar <n°>\n${prefix}uno comprar\n${prefix}uno mao (PV)\n${prefix}uno status\n${prefix}uno cancelar\n${prefix}uno sair`);
      }

      const unoResult = (sc) => {
        switch (sc) {
          case 'criar': case 'create': return uno.createGame(from, sender, pushname);
          case 'entrar': case 'join': return uno.joinGame(from, sender, pushname);
          case 'iniciar': case 'start': return uno.startGame(from, sender);
          case 'uno': return uno.callUno(from, sender);
          case 'status': return uno.getStatus(from);
          case 'sair': case 'leave': return uno.leaveGame(from, sender);
          case 'cancelar': case 'parar': case 'cancel': return uno.cancelGame(from, sender, isGroupAdmin);
          case 'comprar': case 'draw': return uno.drawCard(from, sender);
          default: return null;
        }
      };

      if (['jogar', 'play'].includes(subCmd)) {
        const arg = args.slice(cmd === 'uno' ? 1 : 0).join(' ').trim();
        if (!arg) return reply("Especifique a carta!");
        const parts = arg.split(/\s+/);
        const res = uno.playCard(from, sender, parseInt(parts[0]), parts[1]);
        if (res.success) {
          await nazu.sendMessage(from, { text: res.message, mentions: res.mentions || [] });
          const hand = uno.getPlayerHand(from, sender);
          if (hand) try { await nazu.sendMessage(sender, { text: `🎴 *Sua mão:*\n${hand}` }); } catch (e) {}
        } else reply(res.message);
        return;
      }

      if (['mao', 'hand', 'cartas'].includes(subCmd)) {
        const hand = uno.getPlayerHand(from, sender);
        if (hand) {
          try {
            await nazu.sendMessage(sender, { text: `🎴 *Sua mão atual:*\n\n${hand}` });
            return reply('✅ Mão enviada no PV!');
          } catch (e) { return reply(`💔 Não consegui enviar no PV.`); }
        } else return reply(`💔 Você não está no jogo!`);
      }

      const res = unoResult(subCmd);
      if (res) {
        if (subCmd === 'iniciar' && res.success) {
          await reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
          for (const [id, h] of Object.entries(res.hands)) {
            try { await nazu.sendMessage(id, { text: `🎴 *Sua mão inicial:*\n${h}` }); } catch (e) {}
          }
        } else {
          reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
          if (subCmd === 'comprar' && res.newHand) {
            try { await nazu.sendMessage(sender, { text: `🎴 *Sua mão:*\n${res.newHand}` }); } catch (e) {}
          }
        }
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧩 MEMÓRIA
    // ═══════════════════════════════════════════════════════════════
    if (['memoria', 'memory'].includes(cmd)) {
      if (!memoria) return reply("Sistema de Memória indisponível.");
      const subCmd = args[0]?.toLowerCase();
      if (subCmd === 'ranking' || subCmd === 'rank') return reply(memoria.getRanking(10));
      const res = await memoria.handleCommand(from, sender, pushname, subCmd, args.slice(1));
      return reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
    }
  }
};
