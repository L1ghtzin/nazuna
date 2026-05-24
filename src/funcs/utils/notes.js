import { debouncedSaveJson } from '../../utils/helpers.js';
// --- SISTEMA DE NOTAS ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_FILE = path.join(__dirname, '../../../dados/database/notes.json');

const CONFIG = {
    MAX_NOTES_PER_USER: 50,
    MAX_NOTE_LENGTH: 1000,
    MAX_TITLE_LENGTH: 50
};

// Helper para nome de usuário
const getUserName = (userId) => {
    if (!userId || typeof userId !== 'string') return 'unknown';
    return userId.split('@')[0] || userId;
};

// Carregar notas
const loadNotes = () => {
    try {
        if (fs.existsSync(NOTES_FILE)) {
            return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[NOTES] Erro ao carregar:', err.message);
    }
    return { users: {} };
};

// Salvar notas
const saveNotes = (data) => {
    try {
        const dir = path.dirname(NOTES_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        debouncedSaveJson(NOTES_FILE, data, 1000);
    } catch (err) {
        console.error('[NOTES] Erro ao salvar:', err.message);
    }
};

// Obter notas do usuário
const getUserNotes = (userId) => {
    const data = loadNotes();
    if (!data.users[userId]) {
        data.users[userId] = [];
    }
    return data.users[userId];
};

// Gerar ID único para nota
const generateNoteId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Adicionar nota
const addNote = (userId, content, title = null, prefix = '/') => {
    if (!content || content.trim().length === 0) {
        return {
            success: false,
            message: `❌ O conteúdo da nota não pode estar vazio!\n\n💡 Uso: ${prefix}nota <texto>\n📌 Exemplo: ${prefix}nota Lembrar de fazer algo`
        };
    }
    
    if (content.length > CONFIG.MAX_NOTE_LENGTH) {
        return {
            success: false,
            message: `❌ Nota muito longa! Máximo de ${CONFIG.MAX_NOTE_LENGTH} caracteres.`
        };
    }
    
    const data = loadNotes();
    if (!data.users[userId]) {
        data.users[userId] = [];
    }
    
    if (data.users[userId].length >= CONFIG.MAX_NOTES_PER_USER) {
        return {
            success: false,
            message: `❌ Você atingiu o limite de ${CONFIG.MAX_NOTES_PER_USER} notas!\n\n💡 Use ${prefix}nota del <id> para remover notas antigas.`
        };
    }
    
    const note = {
        id: generateNoteId(),
        title: title ? title.slice(0, CONFIG.MAX_TITLE_LENGTH) : null,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: null,
        pinned: false
    };
    
    data.users[userId].push(note);
    saveNotes(data);
    
    return {
        success: true,
        note,
        message: `📝 *NOTA SALVA*\n\n` +
                 `🆔 ID: \`${note.id}\`\n` +
                 `${note.title ? `📌 Título: ${note.title}\n` : ''}` +
                 `📄 ${note.content.slice(0, 100)}${note.content.length > 100 ? '...' : ''}\n\n` +
                 `📊 Total de notas: ${data.users[userId].length}/${CONFIG.MAX_NOTES_PER_USER}`
    };
};

// Listar notas
const listNotes = (userId, page = 1, perPage = 10, prefix = '/') => {
    const notes = getUserNotes(userId);
    
    if (notes.length === 0) {
        return {
            success: true,
            message: `📝 *MINHAS NOTAS*\n\n📭 Você não tem nenhuma nota!\n\n💡 Use ${prefix}nota <texto> para criar uma.`
        };
    }
    
    // Ordenar: fixadas primeiro, depois por data
    const sorted = [...notes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    const totalPages = Math.ceil(sorted.length / perPage);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * perPage;
    const pageNotes = sorted.slice(start, start + perPage);
    
    let message = `📝 *MINHAS NOTAS* (${notes.length}/${CONFIG.MAX_NOTES_PER_USER})\n`;
    message += `📄 Página ${currentPage}/${totalPages}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    pageNotes.forEach((note, i) => {
        const pin = note.pinned ? '📌 ' : '';
        const title = note.title || note.content.slice(0, 30);
        const date = new Date(note.createdAt).toLocaleDateString('pt-BR');
        message += `${pin}*${start + i + 1}.* ${title}${note.content.length > 30 && !note.title ? '...' : ''}\n`;
        message += `   🆔 \`${note.id}\` | 📅 ${date}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `💡 ${prefix}nota ver <id> - Ver nota completa\n`;
    message += `💡 ${prefix}nota del <id> - Apagar nota`;
    
    if (totalPages > 1) {
        message += `\n💡 ${prefix}notas <página> - Ver outras páginas`;
    }
    
    return {
        success: true,
        message,
        totalNotes: notes.length,
        totalPages,
        currentPage
    };
};

// Ver nota específica
const getNote = (userId, noteId, prefix = '/') => {
    const notes = getUserNotes(userId);
    const note = notes.find(n => n.id === noteId || notes.indexOf(n) + 1 === parseInt(noteId));
    
    if (!note) {
        return {
            success: false,
            message: `❌ Nota não encontrada!\n\n💡 Use ${prefix}notas para ver suas notas.`
        };
    }
    
    const date = new Date(note.createdAt).toLocaleString('pt-BR');
    const updated = note.updatedAt ? `\n📝 Editada: ${new Date(note.updatedAt).toLocaleString('pt-BR')}` : '';
    
    return {
        success: true,
        note,
        message: `📝 *NOTA*\n\n` +
                 `🆔 ID: \`${note.id}\`\n` +
                 `${note.title ? `📌 *${note.title}*\n\n` : ''}` +
                 `${note.content}\n\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `📅 Criada: ${date}${updated}\n` +
                 `${note.pinned ? '📌 Fixada' : ''}`
    };
};

// Editar nota
const editNote = (userId, noteId, newContent) => {
    if (!newContent || newContent.trim().length === 0) {
        return {
            success: false,
            message: '❌ O novo conteúdo não pode estar vazio!'
        };
    }
    
    if (newContent.length > CONFIG.MAX_NOTE_LENGTH) {
        return {
            success: false,
            message: `❌ Nota muito longa! Máximo de ${CONFIG.MAX_NOTE_LENGTH} caracteres.`
        };
    }
    
    const data = loadNotes();
    const notes = data.users[userId] || [];
    const noteIndex = notes.findIndex(n => n.id === noteId || notes.indexOf(n) + 1 === parseInt(noteId));
    
    if (noteIndex === -1) {
        return {
            success: false,
            message: '❌ Nota não encontrada!'
        };
    }
    
    notes[noteIndex].content = newContent.trim();
    notes[noteIndex].updatedAt = new Date().toISOString();
    saveNotes(data);
    
    return {
        success: true,
        message: `✅ *NOTA EDITADA*\n\n` +
                 `🆔 ID: \`${notes[noteIndex].id}\`\n` +
                 `📄 ${newContent.slice(0, 100)}${newContent.length > 100 ? '...' : ''}`
    };
};

// Apagar nota
const deleteNote = (userId, noteId) => {
    const data = loadNotes();
    const notes = data.users[userId] || [];
    const noteIndex = notes.findIndex(n => n.id === noteId || notes.indexOf(n) + 1 === parseInt(noteId));
    
    if (noteIndex === -1) {
        return {
            success: false,
            message: '❌ Nota não encontrada!'
        };
    }
    
    const deleted = notes.splice(noteIndex, 1)[0];
    saveNotes(data);
    
    return {
        success: true,
        message: `🗑️ *NOTA APAGADA*\n\n` +
                 `📄 ${deleted.content.slice(0, 50)}${deleted.content.length > 50 ? '...' : ''}\n\n` +
                 `📊 Notas restantes: ${notes.length}`
    };
};

// Fixar/Desafixar nota
const togglePinNote = (userId, noteId) => {
    const data = loadNotes();
    const notes = data.users[userId] || [];
    const note = notes.find(n => n.id === noteId || notes.indexOf(n) + 1 === parseInt(noteId));
    
    if (!note) {
        return {
            success: false,
            message: '❌ Nota não encontrada!'
        };
    }
    
    note.pinned = !note.pinned;
    saveNotes(data);
    
    return {
        success: true,
        message: note.pinned 
            ? `📌 Nota fixada!` 
            : `📌 Nota desafixada!`
    };
};

// Pesquisar notas
const searchNotes = (userId, query) => {
    if (!query || query.trim().length < 2) {
        return {
            success: false,
            message: '❌ Digite pelo menos 2 caracteres para pesquisar!'
        };
    }
    
    const notes = getUserNotes(userId);
    const queryLower = query.toLowerCase();
    
    const results = notes.filter(n => 
        n.content.toLowerCase().includes(queryLower) ||
        (n.title && n.title.toLowerCase().includes(queryLower))
    );
    
    if (results.length === 0) {
        return {
            success: true,
            message: `🔍 *PESQUISA*\n\nNenhuma nota encontrada para "${query}".`
        };
    }
    
    let message = `🔍 *PESQUISA: "${query}"*\n`;
    message += `📊 ${results.length} resultado(s)\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    results.slice(0, 10).forEach((note, i) => {
        const title = note.title || note.content.slice(0, 30);
        message += `*${i + 1}.* ${title}${note.content.length > 30 && !note.title ? '...' : ''}\n`;
        message += `   🆔 \`${note.id}\`\n\n`;
    });
    
    if (results.length > 10) {
        message += `_... e mais ${results.length - 10} resultados_`;
    }
    
    return {
        success: true,
        message,
        results
    };
};

// Apagar todas as notas
const clearAllNotes = (userId) => {
    const data = loadNotes();
    const count = (data.users[userId] || []).length;
    
    if (count === 0) {
        return {
            success: false,
            message: '❌ Você não tem notas para apagar!'
        };
    }
    
    data.users[userId] = [];
    saveNotes(data);
    
    return {
        success: true,
        message: `🗑️ *NOTAS APAGADAS*\n\n${count} nota(s) foram removidas.`
    };
};

export {
    addNote,
    listNotes,
    getNote,
    editNote,
    deleteNote,
    togglePinNote,
    searchNotes,
    clearAllNotes,
    getUserNotes,
    CONFIG as NOTES_CONFIG
};

export default {
    addNote,
    listNotes,
    getNote,
    editNote,
    deleteNote,
    togglePinNote,
    searchNotes,
    clearAllNotes
};
