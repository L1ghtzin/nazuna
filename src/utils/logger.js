/**
 * Logger - Utilitário para formatação de logs do bot no terminal
 */

/**
 * Calcula largura visual real (emojis = 2, texto/símbolos = 1)
 */
const getVisualWidth = (str) => {
    let width = 0;
    for (const char of str) {
        const cp = char.codePointAt(0);
        // Wide characters (Emojis e afins)
        if ((cp >= 0x1F300 && cp <= 0x1F9FF) || (cp >= 0x2600 && cp <= 0x27BF) || (cp >= 0x1F600 && cp <= 0x1F64F)) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
};

const boxWidth = 40;

const formatLine = (label, content, icon = '') => {
    const prefix = `┃ ${icon}${icon ? ' ' : ''}${label}: ${content}`;
    const visualWidth = getVisualWidth(prefix);
    const padding = Math.max(0, boxWidth - visualWidth - 1);
    return `${prefix}${' '.repeat(padding)}┃`;
};

/**
 * Loga uma mensagem processada no terminal com formato de caixa
 */
export function logProcessedMessage(ctx) {
    try {
        if (!ctx.body || ctx.body.length <= 1) return;

        const timestamp = new Date().toLocaleTimeString('pt-BR', {
            hour12: false,
            timeZone: 'America/Sao_Paulo'
        });
        
        const messageType = ctx.isCmd ? 'COMANDO' : 'MENSAGEM';
        const context = ctx.isGroup ? 'GRUPO' : 'PRIVADO';
        
        // Preview inteligente
        let messagePreview;
        if (ctx.isCmd) {
            messagePreview = `${ctx.prefix}${ctx.command}${ctx.q ? ` ${ctx.q.substring(0, 25)}${ctx.q.length > 25 ? '...' : ''}` : ''}`;
        } else {
            messagePreview = ctx.body.substring(0, 35) + (ctx.body.length > 35 ? '...' : '');
        }

        const titleLine = `┃ ${messageType} [${context}]`;
        const titlePadding = Math.max(0, boxWidth - getVisualWidth(titleLine) - 1);

        console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
        console.log(`${titleLine}${' '.repeat(titlePadding)}┃`);
        console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
        console.log(formatLine('Conteúdo', messagePreview.substring(0, 25), '📜'));
        
        if (ctx.isGroup) {
            console.log(formatLine('Grupo', (ctx.groupName || 'Desconhecido').substring(0, 20), '👥'));
            console.log(formatLine('Usuário', (ctx.pushname || 'Sem Nome').substring(0, 20), '👤'));
        } else {
            console.log(formatLine('Usuário', (ctx.pushname || 'Sem Nome').substring(0, 20), '👤'));
            console.log(formatLine('Número', ctx.getUserName(ctx.sender).substring(0, 20), '📱'));
        }
        
        console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
        console.log(formatLine('Data/Hora', timestamp, '🕒'));
        console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
    } catch (error) {
        console.error('┃ 🚨 Erro ao gerar logs:', error.message);
    }
}
