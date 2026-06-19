import { funcsMessages } from '../../utils/messages/funcs.js';

// --- JOGO CONNECT 4 ---
const CONFIG = {
    INVITATION_TIMEOUT_MS: 15 * 60 * 1000,
    GAME_TIMEOUT_MS: 30 * 60 * 1000,
    MOVE_TIMEOUT_MS: 5 * 60 * 1000,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
    ROWS: 6,
    COLS: 7,
    WIN_LENGTH: 4,
    SYMBOLS: { 1: '🔴', 2: '🟡' },
    EMPTY: '⚪',
    NUMBERS: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣']
};

// Helper para extrair nome de usuário
const getUserName = (userId) => {
    if (!userId || typeof userId !== 'string') return 'unknown';
    return userId.split('@')[0] || userId;
};

// --- MOTOR DO JOGO ---
class Connect4Engine {
    constructor(player1, player2) {
        this.board = Array(CONFIG.ROWS).fill(null).map(() => Array(CONFIG.COLS).fill(0));
        this.players = { 1: player1, 2: player2 };
        this.currentTurn = 1;
        this.moves = 0;
        this.startTime = Date.now();
        this.lastMoveTime = Date.now();
        this.winner = null;
        this.winningCells = [];
    }

    makeMove(player, column) {
        if (player !== this.players[this.currentTurn]) {
            return { success: false, reason: 'not_your_turn' };
        }

        const col = parseInt(column) - 1;
        if (isNaN(col) || col < 0 || col >= CONFIG.COLS) {
            return { success: false, reason: 'invalid_column' };
        }

        // Encontrar a linha mais baixa disponível
        let row = -1;
        for (let r = CONFIG.ROWS - 1; r >= 0; r--) {
            if (this.board[r][col] === 0) {
                row = r;
                break;
            }
        }

        if (row === -1) {
            return { success: false, reason: 'column_full' };
        }

        this.board[row][col] = this.currentTurn;
        this.moves++;
        this.lastMoveTime = Date.now();

        // Verificar vitória
        if (this._checkWin(row, col)) {
            this.winner = this.players[this.currentTurn];
            return { success: true, status: 'win', winner: this.winner };
        }

        // Verificar empate
        if (this.moves === CONFIG.ROWS * CONFIG.COLS) {
            return { success: true, status: 'draw' };
        }

        // Próximo jogador
        this.currentTurn = this.currentTurn === 1 ? 2 : 1;
        return { success: true, status: 'continue', nextPlayer: this.players[this.currentTurn] };
    }

    renderBoard() {
        let board = '';
        
        // Número das colunas
        board += CONFIG.NUMBERS.join('') + '\n';
        
        // Tabuleiro
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                const cell = this.board[r][c];
                if (cell === 0) {
                    board += CONFIG.EMPTY;
                } else {
                    board += CONFIG.SYMBOLS[cell];
                }
            }
            board += '\n';
        }

        return board;
    }

    _checkWin(row, col) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal \
            [1, -1]   // Diagonal /
        ];

        const player = this.board[row][col];

        for (const [dr, dc] of directions) {
            let count = 1;
            const cells = [[row, col]];

            // Verificar em uma direção
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS && this.board[r][c] === player) {
                count++;
                cells.push([r, c]);
                r += dr;
                c += dc;
            }

            // Verificar na direção oposta
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS && this.board[r][c] === player) {
                count++;
                cells.push([r, c]);
                r -= dr;
                c -= dc;
            }

            if (count >= CONFIG.WIN_LENGTH) {
                this.winningCells = cells;
                return true;
            }
        }

        return false;
    }
}

// --- GERENCIADOR DE JOGOS ---
class Connect4Manager {
    constructor() {
        this.activeGames = new Map();
        this.pendingInvitations = new Map();
        setInterval(() => this._cleanup(), CONFIG.CLEANUP_INTERVAL_MS);
    }

    invitePlayer(groupId, inviter, invitee) {
        if (!groupId || !inviter || !invitee || inviter === invitee) {
            return this._formatResponse(false, funcsMessages.connect4.invalidInvite);
        }
        if (this.activeGames.has(groupId) || this.pendingInvitations.has(groupId)) {
            return this._formatResponse(false, funcsMessages.connect4.alreadyPlaying);
        }

        this.pendingInvitations.set(groupId, { inviter, invitee, timestamp: Date.now() });
        const message = funcsMessages.connect4.invite(getUserName(inviter), getUserName(invitee));
        return this._formatResponse(true, message, { mentions: [inviter, invitee] });
    }

    processInvitationResponse(groupId, invitee, response) {
        const invitation = this.pendingInvitations.get(groupId);
        if (!invitation || invitation.invitee !== invitee) {
            return this._formatResponse(false, funcsMessages.connect4.noPendingInvite);
        }

        const normalizedResponse = response.toLowerCase().trim();
        const isAccepted = ['s', 'sim', 'y', 'yes'].includes(normalizedResponse);
        const isRejected = ['n', 'não', 'nao', 'no'].includes(normalizedResponse);

        if (!isAccepted && !isRejected) {
            return this._formatResponse(false, funcsMessages.connect4.invalidResponse);
        }

        this.pendingInvitations.delete(groupId);

        if (isRejected) {
            return this._formatResponse(true, funcsMessages.connect4.inviteRejected, { mentions: [invitation.inviter, invitee] });
        }

        const game = new Connect4Engine(invitation.inviter, invitation.invitee);
        this.activeGames.set(groupId, game);

        const message = funcsMessages.connect4.gameStarted(CONFIG.SYMBOLS[1], getUserName(invitation.inviter), CONFIG.SYMBOLS[2], getUserName(invitation.invitee), game.renderBoard(), getUserName(invitation.inviter));
        return this._formatResponse(true, message, { mentions: [invitation.inviter, invitee] });
    }

    makeMove(groupId, player, column) {
        const game = this.activeGames.get(groupId);
        if (!game) {
            return this._formatResponse(false, funcsMessages.connect4.noActiveGame);
        }

        // Verificação de timeout
        if (Date.now() - game.lastMoveTime > CONFIG.MOVE_TIMEOUT_MS) {
            this.activeGames.delete(groupId);
            return this._formatResponse(false, funcsMessages.connect4.gameTimeout, { mentions: Object.values(game.players) });
        }

        const result = game.makeMove(player, column);

        if (!result.success) {
            const errorMessages = {
                'not_your_turn': funcsMessages.connect4.notYourTurn,
                'invalid_column': funcsMessages.connect4.invalidColumn,
                'column_full': funcsMessages.connect4.columnFull
            };
            return this._formatResponse(false, errorMessages[result.reason] || funcsMessages.connect4.unknownError);
        }

        if (result.status === 'win') {
            this.activeGames.delete(groupId);
            const message = funcsMessages.connect4.gameWon(getUserName(result.winner), game.renderBoard());
            return this._formatResponse(true, message, { finished: true, winner: result.winner, mentions: [result.winner] });
        }

        if (result.status === 'draw') {
            this.activeGames.delete(groupId);
            const message = funcsMessages.connect4.gameDraw(game.renderBoard());
            return this._formatResponse(true, message, { finished: true, draw: true, mentions: Object.values(game.players) });
        }

        if (result.status === 'continue') {
            const message = funcsMessages.connect4.gameContinue(getUserName(result.nextPlayer), game.renderBoard());
            return this._formatResponse(true, message, { finished: false, mentions: [result.nextPlayer] });
        }
    }

    endGame(groupId) {
        if (!this.activeGames.has(groupId)) {
            return this._formatResponse(false, funcsMessages.connect4.noActiveGame);
        }
        const players = Object.values(this.activeGames.get(groupId).players);
        this.activeGames.delete(groupId);
        return this._formatResponse(true, funcsMessages.connect4.gameEndedManual, { mentions: players });
    }

    hasActiveGame = (groupId) => this.activeGames.has(groupId);
    hasPendingInvitation = (groupId) => this.pendingInvitations.has(groupId);
    getActiveGame = (groupId) => this.activeGames.get(groupId);
    getPendingInvitation = (groupId) => this.pendingInvitations.get(groupId);

    _formatResponse(success, message, extras = {}) {
        return { success, message, ...extras };
    }

    _cleanup() {
        const now = Date.now();

        // Limpar convites expirados
        for (const [groupId, invitation] of this.pendingInvitations) {
            if (now - invitation.timestamp > CONFIG.INVITATION_TIMEOUT_MS) {
                this.pendingInvitations.delete(groupId);
            }
        }

        // Limpar jogos inativos
        for (const [groupId, game] of this.activeGames) {
            if (now - game.lastMoveTime > CONFIG.GAME_TIMEOUT_MS) {
                this.activeGames.delete(groupId);
            }
        }
    }
}

// Singleton
const manager = new Connect4Manager();

// Exportar funções do manager
const invitePlayer = (groupId, inviter, invitee) => manager.invitePlayer(groupId, inviter, invitee);
const processInvitationResponse = (groupId, invitee, response) => manager.processInvitationResponse(groupId, invitee, response);
const makeMove = (groupId, player, column) => manager.makeMove(groupId, player, column);
const endGame = (groupId) => manager.endGame(groupId);
const hasActiveGame = (groupId) => manager.hasActiveGame(groupId);
const hasPendingInvitation = (groupId) => manager.hasPendingInvitation(groupId);
const getActiveGame = (groupId) => manager.getActiveGame(groupId);
const getPendingInvitation = (groupId) => manager.getPendingInvitation(groupId);

export {
    invitePlayer,
    processInvitationResponse,
    makeMove,
    endGame,
    hasActiveGame,
    hasPendingInvitation,
    getActiveGame,
    getPendingInvitation,
    Connect4Engine,
    Connect4Manager
};

export default {
    invitePlayer,
    processInvitationResponse,
    makeMove,
    endGame,
    hasActiveGame,
    hasPendingInvitation,
    getActiveGame,
    getPendingInvitation
};
