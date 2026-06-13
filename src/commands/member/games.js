export default {
  name: "games",
  description: "Comandos de Jogos",
  commands: ["c4", "connect4", "jogodavelha", "ligue4", "memoria", "memory", "tictactoe", "ttt", "uno"],
  handle: async ({ 
    bot, from, info, command, args, reply, prefix, pushname, sender, menc_os2,
    isGroup, isGroupAdmin, tictactoe, connect4, uno, memoria, normalizeCommand,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    // ═══════════════════════════════════════════════════════════════
    // ❌ TIC TAC TOE (TTT)
    // ═══════════════════════════════════════════════════════════════
    if (['ttt', 'jogodavelha', 'tictactoe'].includes(cmd)) {
      if (!tictactoe) return reply(MESSAGES.member.games.tttUnavailable);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      const result = await tictactoe.invitePlayer(from, sender, menc_os2);
      await bot.sendMessage(from, { text: result.message, mentions: result.mentions });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔴 CONNECT 4
    // ═══════════════════════════════════════════════════════════════
    if (['connect4', 'c4', 'ligue4'].includes(cmd)) {
      if (!connect4) return reply(MESSAGES.member.games.c4Unavailable);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      const result = await connect4.invitePlayer(from, sender, menc_os2);
      await bot.sendMessage(from, { text: result.message, mentions: result.mentions });
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎴 UNO
    // ═══════════════════════════════════════════════════════════════
    const unoCommands = ["uno", "criar", "create", "entrar", "join", "iniciar", "start", "sair", "leave", "cancelar", "cancel", "parar", "mao", "hand", "cartas", "comprar", "draw"];
    if (unoCommands.includes(cmd)) {
      if (!uno) return reply(MESSAGES.member.games.unoUnavailable);
      
      let subCmd = cmd === 'uno' ? normalizeCommand(args[0]) : cmd;
      if (!subCmd || subCmd === 'help') {
        return reply(MESSAGES.member.games.unoHelp(prefix));
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
        if (!arg) return reply(MESSAGES.member.games.unoSpecifyCard);
        const parts = arg.split(/\s+/);
        const res = uno.playCard(from, sender, parseInt(parts[0]), parts[1]);
        if (res.success) {
          await bot.sendMessage(from, { text: res.message, mentions: res.mentions || [] });
          const hand = uno.getPlayerHand(from, sender);
          if (hand) try { await bot.sendMessage(sender, { text: MESSAGES.member.games.unoHand(hand) }); } catch (e) { console.error('Error sending hand to player:', e); }
        } else reply(res.message);
        return;
      }

      if (['mao', 'hand', 'cartas'].includes(subCmd)) {
        const hand = uno.getPlayerHand(from, sender);
        if (hand) {
          try {
            await bot.sendMessage(sender, { text: MESSAGES.member.games.unoHandCurrent(hand) });
            return reply(MESSAGES.member.games.unoHandSent);
          } catch (e) { return reply(MESSAGES.member.games.unoHandFail); }
        } else return reply(MESSAGES.member.games.unoNotInGame);
      }

      const res = unoResult(subCmd);
      if (res) {
        if (subCmd === 'iniciar' && res.success) {
          await reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
          for (const [id, h] of Object.entries(res.hands)) {
            try { await bot.sendMessage(id, { text: MESSAGES.member.games.unoInitialHand(h) }); } catch (e) { console.error('Error sending initial hand:', e); }
          }
        } else {
          reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
          if (subCmd === 'comprar' && res.newHand) {
            try { await bot.sendMessage(sender, { text: MESSAGES.member.games.unoHand(res.newHand) }); } catch (e) { console.error('Error sending drawn hand:', e); }
          }
        }
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧩 MEMÓRIA
    // ═══════════════════════════════════════════════════════════════
    if (['memoria', 'memory'].includes(cmd)) {
      if (!memoria) return reply(MESSAGES.member.games.memoryUnavailable);
      const subCmd = args[0]?.toLowerCase();

      if (subCmd === 'ranking' || subCmd === 'rank') {
        const ranking = memoria.getRanking();
        return reply(ranking.message, ranking.mentions ? { mentions: ranking.mentions } : undefined);
      }

      if (memoria.hasActiveGame(from)) {
        if (!isNaN(subCmd)) {
          const pos = parseInt(subCmd);
          const res = memoria.makeMove(from, sender, pos);
          return reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
        }
        if (subCmd === 'sair' || subCmd === 'parar') {
          const res = memoria.endGame(from, sender, isGroupAdmin);
          return reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
        }
        return reply(MESSAGES.member.games.memoryInProgress(prefix));
      }

      if (subCmd === 'sair' || subCmd === 'parar') {
        return reply(MESSAGES.member.games.memoryNotInGame);
      }

      const res = memoria.startGame(from, sender);
      return reply(res.message, res.mentions ? { mentions: res.mentions } : undefined);
    }
  }
};
