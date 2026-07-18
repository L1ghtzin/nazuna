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

// Novos logs visuais portados do Misa
const colorEnabled = process.stdout.isTTY;

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
};

export function paint(text, ...styles) {
  if (!colorEnabled) return text;
  return `${styles.map((s) => colors[s]).join("")}${text}${colors.reset}`;
}

function pad(text, width) {
  return text.length >= width ? text : `${text}${" ".repeat(width - text.length)}`;
}

function timestampLog() {
  return paint(new Date().toLocaleTimeString("pt-BR"), "gray", "dim");
}

const icons = {
  info:    "◆",
  success: "✔",
  warn:    "▲",
  error:   "✖",
};

export const log = {
  info(scope, message) {
    console.log(`${timestampLog()} ${paint(icons.info, "cyan")}  ${paint(scope, "cyan", "bold")} ${paint("›", "gray")} ${message}`);
  },

  success(scope, message) {
    console.log(`${timestampLog()} ${paint(icons.success, "green")}  ${paint(scope, "green", "bold")} ${paint("›", "gray")} ${message}`);
  },

  warn(scope, message) {
    console.log(`${timestampLog()} ${paint(icons.warn, "yellow")}  ${paint(scope, "yellow", "bold")} ${paint("›", "gray")} ${message}`);
  },

  error(scope, message, error) {
    console.error(`${timestampLog()} ${paint(icons.error, "red")}  ${paint(scope, "red", "bold")} ${paint("›", "gray")} ${message}`);
    if (error) console.error(paint(String(error.stack || error), "gray"));
  },

  box(scope, title, rows, color = "cyan") {
    const width = Math.max(title.length, ...rows.map((r) => r.length), 46);
    const top    = paint("╭─", color) + paint(`[ ${scope} ]`, color, "bold") + paint("─".repeat(width - scope.length - 1) + "╮", color);
    const mid    = paint("├─", color) + paint("─".repeat(width + 3) + "┤", color);
    const bottom = paint("╰" + "─".repeat(width + 4) + "╯", color);

    console.log("");
    console.log(top);
    console.log(`${paint("│", color)}  ${paint(title, color, "bold")}${" ".repeat(width - title.length + 2)}${paint("│", color)}`);
    console.log(mid);
    for (const row of rows) {
      console.log(`${paint("│", color)}  ${paint("›", "gray")} ${pad(row, width)}${paint("│", color)}`);
    }
    console.log(bottom);
    console.log("");
  },
};

export default log;
