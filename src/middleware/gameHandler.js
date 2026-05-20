/**
 * Middleware para processamento de jogos e sistemas de diversão
 */
export async function processGames({
  nazu,
  from,
  sender,
  budy2,
  isGroupAdmin,
  reply,
  tictactoe,
  connect4
}) {
  // TicTacToe (Jogo da Velha)
  if (tictactoe && tictactoe.hasPendingInvitation(from) && budy2) {
    const normalizedResponse = budy2.toLowerCase().trim();
    const result = tictactoe.processInvitationResponse(from, sender, normalizedResponse);
    if (result.success) {
      nazu.sendMessage(from, {
        text: result.message,
        mentions: result.mentions || []
      }).catch(e => console.error('[TICTACTOE] Erro ao enviar resposta de convite:', e.message));
    }
  }

  if (tictactoe && tictactoe.hasActiveGame(from) && budy2) {
    if (['tttend', 'rv', 'fimjogo'].includes(budy2.toLowerCase().trim())) {
      if (!isGroupAdmin) {
        reply("⚠️ Apenas administradores podem encerrar um jogo da velha em andamento.");
        return true; // Interrompe o processamento
      }
      const result = tictactoe.endGame(from);
      reply(result.message);
      return true;
    }

    const position = parseInt(budy2.trim());
    if (!isNaN(position)) {
      const result = tictactoe.makeMove(from, sender, position);
      if (result.success) {
        nazu.sendMessage(from, {
          text: result.message,
          mentions: result.mentions || [sender]
        }).catch(e => console.error('[TICTACTOE] Erro ao enviar jogada:', e.message));
      } else if (result.message) {
        reply(result.message);
      }
      return true;
    }
  }

  // Connect4
  if (connect4 && connect4.hasPendingInvitation && connect4.hasPendingInvitation(from) && budy2) {
    const normalizedResponse = budy2.toLowerCase().trim();
    const result = connect4.processInvitationResponse(from, sender, normalizedResponse);
    if (result.success) {
      await nazu.sendMessage(from, {
        text: result.message,
        mentions: result.mentions || []
      });
    }
  }

  if (connect4 && connect4.hasActiveGame && connect4.hasActiveGame(from) && budy2) {
    if (['c4end', 'fimc4'].includes(budy2.toLowerCase().trim())) {
      if (!isGroupAdmin) {
        await reply("⚠️ Apenas administradores podem encerrar um Connect4 em andamento.");
        return true;
      }
      const result = connect4.endGame(from);
      await reply(result.message);
      return true;
    }

    const column = parseInt(budy2.trim());
    if (!isNaN(column) && column >= 1 && column <= 7) {
      const result = connect4.makeMove(from, sender, column);
      if (result.success) {
        await nazu.sendMessage(from, {
          text: result.message,
          mentions: result.mentions || [sender]
        });
      } else if (result.message) {
        await reply(result.message);
      }
      return true;
    }
  }

  return false;
}
