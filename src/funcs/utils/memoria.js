// --- JOGO DA MEMÓRIA ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RANKING_FILE = path.join(__dirname, '../../../dados/database/memoria_ranking.json');

const CONFIG = {
    GAME_TIMEOUT_MS: 30 * 60 * 1000,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
    GRID_SIZE: 4, // 4x4 = 16 células = 8 pares
    EMOJIS: ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🍒', '🥝', '🍌', '🥭', '🍍', '🥥', '🍑', '🍐', '🫐', '🍈'],
    HIDDEN: '🔲',
    REVEAL_TIME_MS: 2000
};

// Helper para nome de usuário
const getUserName = (userId) => {
    if (!userId || typeof userId !== 'string') return 'unknown';
    return userId.split('@')[0] || userId;
};

// Embaralhar array
const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Converter posição para coordenadas
const posToCoords = (pos) => {
    const index = pos - 1;
    return {
        row: Math.floor(index / CONFIG.GRID_SIZE),
        col: index % CONFIG.GRID_SIZE
    };
};

// Converter coordenadas para posição
const coordsToPos = (row, col) => row * CONFIG.GRID_SIZE + col + 1;

// --- MOTOR DO JOGO ---
class MemoryGame {
    constructor(playerId) {
        this.player = playerId;
        this.gridSize = CONFIG.GRID_SIZE;
        this.totalPairs = (this.gridSize * this.gridSize) / 2;
        this.board = this._createBoard();
        this.revealed = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
        this.matched = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
        this.attempts = 0;
        this.pairsFound = 0;
        this.firstCard = null;
        this.lastMoveTime = Date.now();
        this.startTime = Date.now();
        this.finished = false;
    }

    _createBoard() {
        // Selecionar emojis aleatórios
        const selectedEmojis = shuffle(CONFIG.EMOJIS).slice(0, this.totalPairs);
        // Duplicar para fazer pares
        const pairs = [...selectedEmojis, ...selectedEmojis];
        // Embaralhar
        const shuffled = shuffle(pairs);
        
        // Criar grid
        const board = [];
        for (let i = 0; i < this.gridSize; i++) {
            board.push(shuffled.slice(i * this.gridSize, (i + 1) * this.gridSize));
        }
        return board;
    }

    revealCard(position) {
        if (this.finished) return { success: false, reason: 'game_finished' };
        
        const { row, col } = posToCoords(position);
        
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
            return { success: false, reason: 'invalid_position' };
        }
        
        if (this.revealed[row][col] || this.matched[row][col]) {
            return { success: false, reason: 'already_revealed' };
        }
        
        this.lastMoveTime = Date.now();
        this.revealed[row][col] = true;
        
        if (this.firstCard === null) {
            // Primeira carta da tentativa
            this.firstCard = { row, col, emoji: this.board[row][col] };
            return { 
                success: true, 
                status: 'first_card', 
                emoji: this.board[row][col],
                position
            };
        }
        
        // Segunda carta
        this.attempts++;
        const secondCard = { row, col, emoji: this.board[row][col] };
        const firstCard = this.firstCard;
        this.firstCard = null;
        
        if (firstCard.emoji === secondCard.emoji) {
            // Par encontrado!
            this.matched[firstCard.row][firstCard.col] = true;
            this.matched[secondCard.row][secondCard.col] = true;
            this.pairsFound++;
            
            if (this.pairsFound === this.totalPairs) {
                // Jogo finalizado!
                this.finished = true;
                const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
                return {
                    success: true,
                    status: 'win',
                    attempts: this.attempts,
                    timeTaken,
                    emoji: secondCard.emoji
                };
            }
            
            return {
                success: true,
                status: 'match',
                emoji: secondCard.emoji,
                pairsFound: this.pairsFound,
                totalPairs: this.totalPairs
            };
        }
        
        // Não é par - esconder cartas
        this.revealed[firstCard.row][firstCard.col] = false;
        this.revealed[secondCard.row][secondCard.col] = false;
        
        return {
            success: true,
            status: 'no_match',
            firstEmoji: firstCard.emoji,
            secondEmoji: secondCard.emoji,
            firstPos: coordsToPos(firstCard.row, firstCard.col),
            secondPos: coordsToPos(secondCard.row, secondCard.col)
        };
    }

    renderBoard(showAll = false) {
        let board = '';
        let position = 1;
        
        // Cabeçalho com números de coluna
        board += '    ';
        for (let c = 1; c <= this.gridSize; c++) {
            board += ` ${c}  `;
        }
        board += '\n';
        
        const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        for (let r = 0; r < this.gridSize; r++) {
            board += ` ${rowLabels[r]} `;
            for (let c = 0; c < this.gridSize; c++) {
                if (showAll || this.matched[r][c] || this.revealed[r][c]) {
                    board += ` ${this.board[r][c]} `;
                } else {
                    const pos = coordsToPos(r, c);
                    board += pos < 10 ? ` ${CONFIG.HIDDEN} ` : `${CONFIG.HIDDEN} `;
                }
            }
            board += '\n';
        }
        
        return board;
    }

    renderBoardWithNumbers() {
        let board = '';
        
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.matched[r][c]) {
                    board += ` ${this.board[r][c]} `;
                } else if (this.revealed[r][c]) {
                    board += ` ${this.board[r][c]} `;
                } else {
                    const pos = coordsToPos(r, c);
                    board += pos < 10 ? ` 0${pos} ` : ` ${pos} `;
                }
            }
            board += '\n';
        }
        
        return board;
    }

    getStatus() {
        return {
            attempts: this.attempts,
            pairsFound: this.pairsFound,
            totalPairs: this.totalPairs,
            finished: this.finished,
            waitingSecondCard: this.firstCard !== null
        };
    }
}

// --- RANKING ---
const loadRanking = () => {
    try {
        if (fs.existsSync(RANKING_FILE)) {
            return JSON.parse(fs.readFileSync(RANKING_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[MEMORIA] Erro ao carregar ranking:', err.message);
    }
    return { rankings: [] };
};

const saveRanking = (data) => {
    try {
        const dir = path.dirname(RANKING_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(RANKING_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[MEMORIA] Erro ao salvar ranking:', err.message);
    }
};

const addToRanking = (userId, attempts, timeTaken) => {
    const data = loadRanking();
    data.rankings.push({
        userId,
        attempts,
        timeTaken,
        date: new Date().toISOString()
    });
    // Ordenar por tentativas (menos = melhor), depois por tempo
    data.rankings.sort((a, b) => {
        if (a.attempts !== b.attempts) return a.attempts - b.attempts;
        return a.timeTaken - b.timeTaken;
    });
    // Manter apenas top 100
    data.rankings = data.rankings.slice(0, 100);
    saveRanking(data);
    
    // Retornar posição no ranking
    return data.rankings.findIndex(r => r.userId === userId && r.attempts === attempts) + 1;
};

const getTopRanking = (limit = 10) => {
    const data = loadRanking();
    return data.rankings.slice(0, limit);
};

const getUserBest = (userId) => {
    const data = loadRanking();
    return data.rankings.find(r => r.userId === userId);
};

// --- GERENCIADOR DE JOGOS ---
class MemoryManager {
    constructor() {
        this.activeGames = new Map();
        setInterval(() => this._cleanup(), CONFIG.CLEANUP_INTERVAL_MS);
    }

    startGame(groupId, odIUserId) {
        if (this.activeGames.has(groupId)) {
            return this._formatResponse(false, '❌ Já existe um jogo de memória em andamento neste chat!');
        }
        
        const game = new MemoryGame(odIUserId);
        this.activeGames.set(groupId, game);
        
        const message = `🧠 *JOGO DA MEMÓRIA*\n\n` +
                        `👤 Jogador: @${getUserName(odIUserId)}\n` +
                        `🎯 Encontre os ${game.totalPairs} pares!\n\n` +
                        `${game.renderBoardWithNumbers()}\n` +
                        `📝 Digite o número da posição para revelar.\n` +
                        `💡 Exemplo: "1" ou "memoria 5"`;
        
        return this._formatResponse(true, message, { mentions: [odIUserId] });
    }

    makeMove(groupId, odIUserId, position) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, '❌ Nenhum jogo em andamento!');
        if (game.player !== odIUserId) return this._formatResponse(false, '❌ Este não é seu jogo!');
        
        const result = game.revealCard(parseInt(position));
        
        if (!result.success) {
            const errors = {
                'game_finished': '❌ O jogo já terminou!',
                'invalid_position': '❌ Posição inválida! Use 1-16.',
                'already_revealed': '❌ Esta carta já foi revelada!'
            };
            return this._formatResponse(false, errors[result.reason]);
        }
        
        const status = game.getStatus();
        
        if (result.status === 'first_card') {
            const message = `🧠 *JOGO DA MEMÓRIA*\n\n` +
                            `🎴 Posição ${result.position}: ${result.emoji}\n` +
                            `👆 Escolha a segunda carta!\n\n` +
                            `${game.renderBoardWithNumbers()}\n` +
                            `📊 Tentativas: ${status.attempts} | Pares: ${status.pairsFound}/${status.totalPairs}`;
            return this._formatResponse(true, message);
        }
        
        if (result.status === 'match') {
            const message = `🧠 *JOGO DA MEMÓRIA*\n\n` +
                            `✅ *PAR ENCONTRADO!* ${result.emoji}${result.emoji}\n\n` +
                            `${game.renderBoardWithNumbers()}\n` +
                            `📊 Tentativas: ${status.attempts} | Pares: ${status.pairsFound}/${status.totalPairs}`;
            return this._formatResponse(true, message);
        }
        
        if (result.status === 'no_match') {
            const message = `🧠 *JOGO DA MEMÓRIA*\n\n` +
                            `❌ Não é par!\n` +
                            `${result.firstPos}: ${result.firstEmoji} ≠ ${result.secondPos}: ${result.secondEmoji}\n\n` +
                            `${game.renderBoardWithNumbers()}\n` +
                            `📊 Tentativas: ${status.attempts} | Pares: ${status.pairsFound}/${status.totalPairs}`;
            return this._formatResponse(true, message);
        }
        
        if (result.status === 'win') {
            this.activeGames.delete(groupId);
            const rankPos = addToRanking(odIUserId, result.attempts, result.timeTaken);
            const minutes = Math.floor(result.timeTaken / 60);
            const seconds = result.timeTaken % 60;
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            
            const message = `🧠 *JOGO DA MEMÓRIA - VITÓRIA!*\n\n` +
                            `🎉 @${getUserName(odIUserId)} completou o jogo!\n\n` +
                            `${game.renderBoard(true)}\n` +
                            `📊 *Estatísticas:*\n` +
                            `• Tentativas: ${result.attempts}\n` +
                            `• Tempo: ${timeStr}\n` +
                            `• Ranking: #${rankPos}\n\n` +
                            `${result.attempts <= 12 ? '🏆 *CONQUISTA DESBLOQUEADA: Memória de Elefante!*' : ''}`;
            
            return this._formatResponse(true, message, { 
                finished: true, 
                winner: odIUserId, 
                attempts: result.attempts,
                mentions: [odIUserId]
            });
        }
    }

    endGame(groupId, odIUserId, isAdmin = false) {
        const game = this.activeGames.get(groupId);
        if (!game) return this._formatResponse(false, '❌ Nenhum jogo em andamento!');
        if (game.player !== odIUserId && !isAdmin) {
            return this._formatResponse(false, '❌ Apenas o jogador ou admins podem encerrar!');
        }
        
        this.activeGames.delete(groupId);
        return this._formatResponse(true, '🧠 Jogo da memória encerrado!');
    }

    getRanking() {
        const rankings = getTopRanking(10);
        if (rankings.length === 0) {
            return this._formatResponse(true, '🧠 *RANKING - JOGO DA MEMÓRIA*\n\nNenhum recorde ainda!');
        }
        
        let message = '🧠 *RANKING - JOGO DA MEMÓRIA*\n\n';
        rankings.forEach((r, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const minutes = Math.floor(r.timeTaken / 60);
            const seconds = r.timeTaken % 60;
            const timeStr = minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
            message += `${medal} @${getUserName(r.userId)} - ${r.attempts} tentativas (${timeStr})\n`;
        });
        
        return this._formatResponse(true, message, { mentions: rankings.map(r => r.userId) });
    }

    hasActiveGame = (groupId) => this.activeGames.has(groupId);
    getActiveGame = (groupId) => this.activeGames.get(groupId);

    _formatResponse(success, message, extras = {}) {
        return { success, message, ...extras };
    }

    _cleanup() {
        const now = Date.now();
        for (const [groupId, game] of this.activeGames) {
            if (now - game.lastMoveTime > CONFIG.GAME_TIMEOUT_MS) {
                this.activeGames.delete(groupId);
            }
        }
    }
}

// Singleton
const manager = new MemoryManager();

export {
    MemoryGame,
    MemoryManager,
    manager as memoryManager
};

export default manager;
