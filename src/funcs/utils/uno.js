import { funcsMessages } from '../../utils/messages/funcs.js';

// --- JOGO UNO ---
const CONFIG = {
    INVITATION_TIMEOUT_MS: 5 * 60 * 1000,
    GAME_TIMEOUT_MS: 60 * 60 * 1000,
    TURN_TIMEOUT_MS: 1 * 60 * 1000, // 1 minuto por turno
    MAX_TIMEOUTS: 3, // Expulsa após 3 timeouts consecutivos
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 10,
    INITIAL_CARDS: 7,
    COLORS: ['🔴', '🟡', '🟢', '🔵'],
    COLOR_NAMES: { '🔴': 'vermelho', '🟡': 'amarelo', '🟢': 'verde', '🔵': 'azul' },
    COLOR_CODES: { 'v': '🔴', 'vermelho': '🔴', 'a': '🟡', 'amarelo': '🟡', 'vd': '🟢', 'verde': '🟢', 'az': '🔵', 'azul': '🔵' }
};

// Cards do UNO
const createDeck = () => {
    const deck = [];
    
    for (const color of CONFIG.COLORS) {
        // Um 0 de cada cor
        deck.push({ color, value: '0', display: `${color}0` });
        
        // Dois de cada número 1-9
        for (let i = 1; i <= 9; i++) {
            deck.push({ color, value: String(i), display: `${color}${i}` });
            deck.push({ color, value: String(i), display: `${color}${i}` });
        }
        
        // Cartas especiais (2 de cada por cor)
        for (let i = 0; i < 2; i++) {
            deck.push({ color, value: '🔄', display: `${color}🔄`, special: 'reverse' });
            deck.push({ color, value: '⏭️', display: `${color}⏭️`, special: 'skip' });
            deck.push({ color, value: '+2', display: `${color}+2`, special: 'draw2' });
        }
    }
    
    // Cartas coringas (4 de cada)
    for (let i = 0; i < 4; i++) {
        deck.push({ color: '⬛', value: '🌈', display: '⬛🌈', special: 'wild' });
        deck.push({ color: '⬛', value: '+4', display: '⬛+4', special: 'wild4' });
    }
    
    return deck;
};

// Embaralhar
const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Helper para extrair nome de usuário
const getUserName = (userId) => {
    if (!userId || typeof userId !== 'string') return 'unknown';
    return userId.split('@')[0] || userId;
};

// --- MOTOR DO JOGO ---
class UnoGame {
    constructor(hostId) {
        this.host = hostId;
        this.players = [hostId];
        this.playerNames = {};
        this.hands = {};
        this.deck = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.direction = 1; // 1 = horário, -1 = anti-horário
        this.currentColor = null;
        this.started = false;
        this.winner = null;
        this.pendingDraw = 0;
        this.lastMoveTime = Date.now();
        this.lastTurnTime = Date.now();
        this.startTime = Date.now();
        this.mustCallUno = new Set();
        this.calledUno = new Set();
        this.timeouts = {}; // contador de timeouts consecutivos por jogador
    }

    addPlayer(playerId) {
        if (this.started) return { success: false, reason: 'game_started' };
        if (this.players.length >= CONFIG.MAX_PLAYERS) return { success: false, reason: 'game_full' };
        if (this.players.includes(playerId)) return { success: false, reason: 'already_joined' };
        
        this.players.push(playerId);
        return { success: true };
    }

    removePlayer(playerId) {
        const index = this.players.indexOf(playerId);
        if (index === -1) return { success: false, reason: 'not_in_game' };
        
        // Se o jogo não começou, não pode sair se for host
        if (!this.started && playerId === this.host) {
            return { success: false, reason: 'host_cannot_leave' };
        }
        
        // Se o jogo começou, remove o jogador
        if (this.started) {
            delete this.hands[playerId];
            this.mustCallUno.delete(playerId);
            this.calledUno.delete(playerId);
            delete this.timeouts[playerId];
            
            // Se era o turno do jogador que saiu, ajustar índice
            const wasCurrentPlayer = this.currentPlayerIndex === index;
            
            this.players.splice(index, 1);
            
            // Ajustar índice do jogador atual
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            } else if (index < this.currentPlayerIndex) {
                this.currentPlayerIndex--;
            }
            
            // Se só sobrou 1 jogador, ele vence
            if (this.players.length === 1) {
                this.winner = this.players[0];
                return { success: true, gameEnded: true, winner: this.winner, leftPlayer: playerId };
            }
            
            // Resetar timer se era o turno do jogador que saiu
            if (wasCurrentPlayer) {
                this.lastTurnTime = Date.now();
            }
            
            return { success: true, gameEnded: false, leftPlayer: playerId, nextPlayer: this.getCurrentPlayer() };
        }
        
        // Jogo não começou, apenas remove
        this.players.splice(index, 1);
        return { success: true, gameEnded: false };
    }

    startGame() {
        if (this.started) return { success: false, reason: 'already_started' };
        if (this.players.length < CONFIG.MIN_PLAYERS) return { success: false, reason: 'not_enough_players' };
        
        this.deck = shuffleDeck(createDeck());
        
        // Distribuir cartas
        for (const player of this.players) {
            this.hands[player] = [];
            for (let i = 0; i < CONFIG.INITIAL_CARDS; i++) {
                this.hands[player].push(this.deck.pop());
            }
        }
        
        // Primeira carta (não pode ser especial)
        let firstCard;
        do {
            firstCard = this.deck.pop();
            if (firstCard.special) {
                this.deck.unshift(firstCard);
                this.deck = shuffleDeck(this.deck);
            }
        } while (firstCard.special);
        
        this.discardPile.push(firstCard);
        this.currentColor = firstCard.color;
        this.started = true;
        this.lastMoveTime = Date.now();
        
        return { success: true, firstCard };
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    checkAndProcessTimeout() {
        if (!this.started) return null;
        
        const currentPlayer = this.getCurrentPlayer();
        const timeSinceLastTurn = Date.now() - this.lastTurnTime;
        
        if (timeSinceLastTurn >= CONFIG.TURN_TIMEOUT_MS) {
            // Incrementar contador de timeout
            this.timeouts[currentPlayer] = (this.timeouts[currentPlayer] || 0) + 1;
            
            // Comprar uma carta como penalidade
            if (this.deck.length === 0) this._reshuffleDeck();
            const drawnCard = this.deck.pop();
            this.hands[currentPlayer].push(drawnCard);
            
            const timeoutCount = this.timeouts[currentPlayer];
            
            // Se atingiu 3 timeouts, expulsa o jogador
            if (timeoutCount >= CONFIG.MAX_TIMEOUTS) {
                const removedPlayer = currentPlayer;
                delete this.hands[removedPlayer];
                this.players.splice(this.currentPlayerIndex, 1);
                this.mustCallUno.delete(removedPlayer);
                this.calledUno.delete(removedPlayer);
                delete this.timeouts[removedPlayer];
                
                // Ajustar índice se necessário
                if (this.currentPlayerIndex >= this.players.length) {
                    this.currentPlayerIndex = 0;
                }
                
                // Se só sobrou 1 jogador, ele vence
                if (this.players.length === 1) {
                    this.winner = this.players[0];
                    return {
                        type: 'kicked_and_won',
                        kickedPlayer: removedPlayer,
                        winner: this.winner,
                        timeoutCount
                    };
                }
                
                this.lastTurnTime = Date.now();
                return {
                    type: 'kicked',
                    kickedPlayer: removedPlayer,
                    timeoutCount,
                    nextPlayer: this.getCurrentPlayer()
                };
            }
            
            // Apenas pular o turno
            this._nextPlayer(false);
            this.lastTurnTime = Date.now();
            
            return {
                type: 'timeout',
                player: currentPlayer,
                timeoutCount,
                drawnCard,
                nextPlayer: this.getCurrentPlayer()
            };
        }
        
        return null;
    }

    getTopCard() {
        return this.discardPile[this.discardPile.length - 1];
    }

    canPlayCard(card) {
        const topCard = this.getTopCard();
        
        // Se há cartas para comprar acumuladas, só pode jogar +2 ou +4
        if (this.pendingDraw > 0) {
            if (card.special === 'draw2' && topCard.special === 'draw2') return true;
            if (card.special === 'wild4') return true;
            return false;
        }
        
        // Coringa sempre pode
        if (card.color === '⬛') return true;
        
        // Mesma cor ou mesmo número/símbolo
        if (card.color === this.currentColor) return true;
        if (card.value === topCard.value) return true;
        
        return false;
    }

    playCard(playerId, cardIndex, chosenColor = null) {
        if (!this.started) return { success: false, reason: 'not_started' };
        if (this.getCurrentPlayer() !== playerId) return { success: false, reason: 'not_your_turn' };
        
        const hand = this.hands[playerId];
        if (cardIndex < 0 || cardIndex >= hand.length) {
            return { success: false, reason: 'invalid_card' };
        }
        
        const card = hand[cardIndex];
        if (!this.canPlayCard(card)) {
            return { success: false, reason: 'cannot_play_card' };
        }

        // Validação de cor para coringa/+4 antes de remover carta
        if (card.special === 'wild' || card.special === 'wild4') {
            if (!chosenColor || !CONFIG.COLOR_CODES[chosenColor.toLowerCase()]) {
                return { success: false, reason: 'choose_color' };
            }
        }

        // Remover carta da mão e adicionar ao descarte
        hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.lastMoveTime = Date.now();
        this.lastTurnTime = Date.now();
        
        // Resetar contador de timeouts ao jogar
        this.timeouts[playerId] = 0;

        // Verificar UNO
        if (hand.length === 1) {
            this.mustCallUno.add(playerId);
        }
        this.calledUno.delete(playerId);

        // Verificar vitória
        if (hand.length === 0) {
            this.winner = playerId;
            return { success: true, status: 'win', winner: playerId, card };
        }

        // Processar efeitos especiais
        let skipNext = false;
        let message = '';

        switch (card.special) {
            case 'reverse':
                this.direction *= -1;
                message = '🔄 Direção invertida!';
                if (this.players.length === 2) skipNext = true;
                break;

            case 'skip':
                skipNext = true;
                message = '⏭️ Próximo jogador foi pulado!';
                break;

            case 'draw2':
                this.pendingDraw += 2;
                message = `+2! Próximo jogador deve comprar ${this.pendingDraw} cartas ou jogar outro +2!`;
                break;

            case 'wild':
                this.currentColor = CONFIG.COLOR_CODES[chosenColor.toLowerCase()];
                message = `🌈 Cor alterada para ${CONFIG.COLOR_NAMES[this.currentColor]}!`;
                break;

            case 'wild4':
                this.currentColor = CONFIG.COLOR_CODES[chosenColor.toLowerCase()];
                this.pendingDraw += 4;
                message = `+4! Cor: ${CONFIG.COLOR_NAMES[this.currentColor]}. Próximo deve comprar ${this.pendingDraw} ou jogar +4!`;
                break;

            default:
                this.currentColor = card.color;
        }

        // Avançar para próximo jogador
        this._nextPlayer(skipNext);

        return {
            success: true,
            status: 'continue',
            card,
            message,
            nextPlayer: this.getCurrentPlayer()
        };
    }

    drawCard(playerId) {
        if (!this.started) return { success: false, reason: 'not_started' };
        if (this.getCurrentPlayer() !== playerId) return { success: false, reason: 'not_your_turn' };
        
        this.lastMoveTime = Date.now();
        this.lastTurnTime = Date.now();
        
        // Resetar contador de timeouts ao jogar
        this.timeouts[playerId] = 0;
        
        const hand = this.hands[playerId];
        
        // Se há cartas pendentes para comprar
        if (this.pendingDraw > 0) {
            const drawnCards = [];
            for (let i = 0; i < this.pendingDraw; i++) {
                if (this.deck.length === 0) this._reshuffleDeck();
                drawnCards.push(this.deck.pop());
            }
            hand.push(...drawnCards);
            this.pendingDraw = 0;
            this._nextPlayer(false);
            
            return { 
                success: true, 
                drawnCards, 
                count: drawnCards.length,
                nextPlayer: this.getCurrentPlayer()
            };
        }
        
        // Comprar uma carta normal
        if (this.deck.length === 0) this._reshuffleDeck();
        const drawnCard = this.deck.pop();
        hand.push(drawnCard);
        
        // Verificar se pode jogar a carta comprada
        if (this.canPlayCard(drawnCard)) {
            return { 
                success: true, 
                drawnCard, 
                canPlay: true,
                cardIndex: hand.length - 1
            };
        }
        
        this._nextPlayer(false);
        return { 
            success: true, 
            drawnCard, 
            canPlay: false,
            nextPlayer: this.getCurrentPlayer()
        };
    }

    callUno(playerId) {
        if (this.mustCallUno.has(playerId)) {
            this.calledUno.add(playerId);
            this.mustCallUno.delete(playerId);
            return { success: true };
        }
        return { success: false, reason: 'no_uno' };
    }

    catchUno(playerId, targetId) {
        if (this.mustCallUno.has(targetId) && !this.calledUno.has(targetId)) {
            // Penalidade: comprar 2 cartas
            for (let i = 0; i < 2; i++) {
                if (this.deck.length === 0) this._reshuffleDeck();
                this.hands[targetId].push(this.deck.pop());
            }
            this.mustCallUno.delete(targetId);
            return { success: true, target: targetId };
        }
        return { success: false, reason: 'cannot_catch' };
    }

    getPlayerHand(playerId) {
        return this.hands[playerId] || [];
    }

    formatHand(playerId) {
        const hand = this.hands[playerId];
        if (!hand) return 'Você não está no jogo.';
        
        return hand.map((card, i) => `${i + 1}. ${card.display}`).join('\n');
    }

    getGameStatus() {
        if (!this.started) {
            return {
                started: false,
                players: this.players,
                host: this.host,
                waitingFor: CONFIG.MIN_PLAYERS - this.players.length
            };
        }
        
        return {
            started: true,
            topCard: this.getTopCard(),
            currentColor: this.currentColor,
            currentPlayer: this.getCurrentPlayer(),
            direction: this.direction === 1 ? '➡️' : '⬅️',
            pendingDraw: this.pendingDraw,
            playerCardCounts: Object.fromEntries(
                this.players.map(p => [p, this.hands[p].length])
            )
        };
    }

    renderStatus() {
        const status = this.getGameStatus();
        
        if (!status.started) {
            let msg = `🃏 *UNO - AGUARDANDO JOGADORES*\n\n`;
            msg += `👥 Jogadores (${this.players.length}/${CONFIG.MAX_PLAYERS}):\n`;
            this.players.forEach((p, i) => {
                msg += `${i + 1}. @${getUserName(p)}${p === this.host ? ' 👑' : ''}\n`;
            });
            if (this.players.length < CONFIG.MIN_PLAYERS) {
                msg += `\n⚠️ Faltam ${CONFIG.MIN_PLAYERS - this.players.length} jogador(es) para iniciar.`;
            } else {
                msg += `\n✅ Pronto para iniciar! Host, use "iniciar".`;
            }
            return { text: msg, mentions: this.players };
        }
        
        let msg = `🃏 *UNO*\n\n`;
        msg += `🎴 Carta: ${status.topCard.display}\n`;
        msg += `🎨 Cor: ${status.currentColor} ${CONFIG.COLOR_NAMES[status.currentColor] || ''}\n`;
        msg += `${status.direction} Direção\n`;
        if (status.pendingDraw > 0) {
            msg += `⚠️ Comprar: ${status.pendingDraw} cartas\n`;
        }
        msg += `\n👥 Cartas:\n`;
        this.players.forEach(p => {
            const isCurrentPlayer = p === status.currentPlayer;
            msg += `${isCurrentPlayer ? '👉 ' : '   '}@${getUserName(p)}: ${status.playerCardCounts[p]} cartas\n`;
        });
        msg += `\n💡 Vez de @${getUserName(status.currentPlayer)}`;
        
        return { text: msg, mentions: this.players };
    }

    _nextPlayer(skip = false) {
        let steps = skip ? 2 : 1;
        this.currentPlayerIndex = (this.currentPlayerIndex + (this.direction * steps) + this.players.length) % this.players.length;
    }

    _reshuffleDeck() {
        const topCard = this.discardPile.pop();
        this.deck = shuffleDeck(this.discardPile);
        this.discardPile = [topCard];
    }
}

// --- GERENCIADOR DE JOGOS ---
class UnoManager {
    constructor() {
        this.activeGames = new Map();
        setInterval(() => this._cleanup(), CONFIG.CLEANUP_INTERVAL_MS);
    }

    createGame(groupId, hostId) {
        if (this.activeGames.has(groupId)) {
            return this._formatResponse(false, funcsMessages.uno.alreadyExists);
        }
        
        const game = new UnoGame(hostId);
        this.activeGames.set(groupId, game);
        
        const message = funcsMessages.uno.created(getUserName(hostId), CONFIG.MAX_PLAYERS, CONFIG.MIN_PLAYERS);
        
        return this._formatResponse(true, message, { mentions: [hostId] });
    }

    joinGame(groupId, playerId) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        const result = game.addPlayer(playerId);
        if (!result.success) {
            const errors = {
                'game_started': funcsMessages.uno.gameStartedError,
                'game_full': funcsMessages.uno.gameFull,
                'already_joined': funcsMessages.uno.alreadyJoined
            };
            return this._formatResponse(false, errors[result.reason]);
        }
        
        const status = game.renderStatus();
        return this._formatResponse(true, funcsMessages.uno.joined(getUserName(playerId), status.text), { mentions: status.mentions });
    }

    leaveGame(groupId, playerId) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        const result = game.removePlayer(playerId);
        if (!result.success) {
            const errors = {
                'not_in_game': funcsMessages.uno.notInGame,
                'host_cannot_leave': funcsMessages.uno.hostCannotLeave
            };
            return this._formatResponse(false, errors[result.reason]);
        }
        
        // Se o jogo terminou porque só sobrou 1 jogador
        if (result.gameEnded) {
            this.activeGames.delete(groupId);
            return this._formatResponse(true, 
                funcsMessages.uno.leftWoWinner(getUserName(result.leftPlayer), getUserName(result.winner)),
                { 
                    mentions: [result.leftPlayer, result.winner],
                    finished: true,
                    winner: result.winner
                }
            );
        }
        
        // Jogo continua
        if (result.nextPlayer) {
            const status = game.renderStatus();
            return this._formatResponse(true, 
                funcsMessages.uno.leftContinue(getUserName(result.leftPlayer), status.text),
                { mentions: [...status.mentions, result.leftPlayer] }
            );
        }
        
        // Jogo não havia iniciado
        return this._formatResponse(true, funcsMessages.uno.leftNoStart(getUserName(playerId)), { mentions: [playerId] });
    }

    startGame(groupId, playerId) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        if (game.host !== playerId) return this._formatResponse(false, funcsMessages.uno.notHostStart);
        
        const result = game.startGame();
        if (!result.success) {
            const errors = {
                'already_started': funcsMessages.uno.gameStartedError,
                'not_enough_players': funcsMessages.uno.notEnoughPlayers(CONFIG.MIN_PLAYERS)
            };
            return this._formatResponse(false, errors[result.reason]);
        }
        
        const status = game.renderStatus();
        let message = funcsMessages.uno.started(result.firstCard.display, status.text);

        
        return this._formatResponse(true, message, { 
            mentions: status.mentions,
            started: true,
            sendHands: true,
            players: game.players,
            hands: Object.fromEntries(
                game.players.map(p => [p, game.formatHand(p)])
            )
        });
    }

    playCard(groupId, playerId, cardIndex, chosenColor = null) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        const result = game.playCard(playerId, cardIndex - 1, chosenColor);
        if (!result.success) {
            const errors = {
                'not_started': funcsMessages.uno.notStarted,
                'not_your_turn': funcsMessages.uno.notYourTurn,
                'invalid_card': funcsMessages.uno.invalidCard,
                'cannot_play_card': funcsMessages.uno.cannotPlayCard,
                'choose_color': funcsMessages.uno.chooseColor
            };
            return this._formatResponse(false, errors[result.reason]);
        }
        
        if (result.status === 'win') {
            this.activeGames.delete(groupId);
            const message = funcsMessages.uno.win(getUserName(result.winner), result.card.display);
            return this._formatResponse(true, message, { 
                finished: true, 
                winner: result.winner, 
                mentions: [result.winner] 
            });
        }
        
        const status = game.renderStatus();
        let message = funcsMessages.uno.played(getUserName(playerId), result.card.display, result.message, status.text);
        
        return this._formatResponse(true, message, { mentions: status.mentions });
    }

    drawCard(groupId, playerId) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        const result = game.drawCard(playerId);
        if (!result.success) {
            const errors = {
                'not_started': funcsMessages.uno.notStarted,
                'not_your_turn': funcsMessages.uno.notYourTurn
            };
            return this._formatResponse(false, errors[result.reason]);
        }
        
        if (result.count) {
            // Comprou múltiplas cartas (penalidade)
            const status = game.renderStatus();
            const message = funcsMessages.uno.drawnMulti(getUserName(playerId), result.count, status.text);
            return this._formatResponse(true, message, { 
                mentions: status.mentions,
                drawnCards: result.drawnCards,
                sendToPlayer: playerId
            });
        }
        
        if (result.canPlay) {
            return this._formatResponse(true, 
                funcsMessages.uno.drawnPlayable(result.drawnCard.display, result.cardIndex + 1),
                { sendToPlayer: playerId, canPlay: true }
            );
        }
        
        const status = game.renderStatus();
        const message = funcsMessages.uno.drawnPass(getUserName(playerId), status.text);
        return this._formatResponse(true, message, { 
            mentions: status.mentions,
            drawnCard: result.drawnCard,
            sendToPlayer: playerId
        });
    }

    callUno(groupId, playerId) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        const result = game.callUno(playerId);
        if (result.success) {
            return this._formatResponse(true, funcsMessages.uno.calledUno(getUserName(playerId)), { mentions: [playerId] });
        }
        return this._formatResponse(false, funcsMessages.uno.noUnoToCall);
    }

    catchUno(groupId, catcherId, targetId) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        const result = game.catchUno(catcherId, targetId);
        if (result.success) {
            return this._formatResponse(true, 
                funcsMessages.uno.caughtUno(getUserName(catcherId), getUserName(targetId)),
                { mentions: [catcherId, targetId] }
            );
        }
        return this._formatResponse(false, funcsMessages.uno.nobodyToCatch);
    }

    getPlayerHand(groupId, playerId) {
        const game = this.activeGames.get(groupId);
        if (!game) return null;
        return game.formatHand(playerId);
    }
    
    checkTimeout(groupId) {
        const game = this.activeGames.get(groupId);
        if (!game) return null;
        
        const timeoutResult = game.checkAndProcessTimeout();
        if (!timeoutResult) return null;
        
        if (timeoutResult.type === 'kicked_and_won') {
            this.activeGames.delete(groupId);
            return this._formatResponse(true, 
                funcsMessages.uno.kickedWon(getUserName(timeoutResult.kickedPlayer), timeoutResult.timeoutCount, getUserName(timeoutResult.winner)),
                { 
                    mentions: [timeoutResult.kickedPlayer, timeoutResult.winner],
                    finished: true,
                    winner: timeoutResult.winner
                }
            );
        }
        
        if (timeoutResult.type === 'kicked') {
            const status = game.renderStatus();
            return this._formatResponse(true,
                funcsMessages.uno.kickedContinue(getUserName(timeoutResult.kickedPlayer), timeoutResult.timeoutCount, status.text),
                { mentions: [...status.mentions, timeoutResult.kickedPlayer] }
            );
        }
        
        if (timeoutResult.type === 'timeout') {
            const status = game.renderStatus();
            return this._formatResponse(true,
                funcsMessages.uno.timeoutWarn(getUserName(timeoutResult.player), timeoutResult.timeoutCount, CONFIG.MAX_TIMEOUTS, status.text),
                { mentions: [...status.mentions, timeoutResult.player] }
            );
        }
        
        return null;
    }

    getStatus(groupId) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        const status = game.renderStatus();
        return this._formatResponse(true, status.text, { mentions: status.mentions });
    }

    cancelGame(groupId, playerId, isAdmin = false) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, funcsMessages.uno.noGame);
        
        if (game.host !== playerId && !isAdmin) {
            return this._formatResponse(false, funcsMessages.uno.notHostCancel);
        }
        
        const players = game.players;
        this.activeGames.delete(groupId);
        return this._formatResponse(true, funcsMessages.uno.cancelled, { mentions: players });
    }

    hasActiveGame = (groupId) => this.activeGames.has(groupId);
    getActiveGame = (groupId) => this.activeGames.get(groupId);

    _formatResponse(success, message, extras = {}) {
        return { success, message, ...extras };
    }

    _cleanup() {
        const now = Date.now();
        for (const [groupId, game] of this.activeGames) {
            const timeout = game.started ? CONFIG.GAME_TIMEOUT_MS : CONFIG.INVITATION_TIMEOUT_MS;
            if (now - game.lastMoveTime > timeout) {
                this.activeGames.delete(groupId);
            }
        }
    }
}

// Singleton
const manager = new UnoManager();

export {
    UnoGame,
    UnoManager,
    manager as unoManager
};

export default manager;
