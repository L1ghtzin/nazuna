import pathz from 'path';
import { PREFIX } from "../../config.js";

export default {
  name: "marcar",
  description: "Menciona membros ou administradores do grupo",
  commands: ["adm", "admin", "admins", "adms", "marcar", "mark"],
  usage: `${PREFIX}marcar <mensagem>`,
  handle: async ({  
    nazu, from, info, command, args, reply, pushname, isGroup, isGroupAdmin, isBotAdmin, 
    AllgroupMembers, groupAdmins, q, getUserName
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    // ═══════════════════════════════════════════════════════════════
    // 📢 MENCIONAR TODOS (MARCAR)
    // ═══════════════════════════════════════════════════════════════
    if (['marcar', 'mark', 'todos', 'all', 'mencionar'].includes(cmd)) {
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

      const checkMassMentionLimit = (await import('../../utils/helpers.js')).checkMassMentionLimit;
      const loadMassMentionConfig = (await import('../../utils/helpers.js')).loadMassMentionConfig;
      const registerMassMentionUse = (await import('../../utils/helpers.js')).registerMassMentionUse;
      const MASS_MENTION_THRESHOLD = 50;

      const massMentionCheck = checkMassMentionLimit(from, AllgroupMembers.length);
      if (!massMentionCheck.allowed) {
        return reply(massMentionCheck.message);
      }

      const GRUPOS_DIR = pathz.join(process.cwd(), 'database/grupos');
      const path = pathz.join(GRUPOS_DIR, `${from}.json`);
      const optimizer = (await import('../../index.js')).getPerformanceOptimizer();
      
      let data = await optimizer.loadJsonWithCache(path, { mark: {} });
      if (!data.mark) data.mark = {};

      let membros = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));
      if (!membros.length) return reply('❌ Nenhum membro para mencionar.');

      const configMarcar = loadMassMentionConfig();
      if (configMarcar[from]?.enabled && AllgroupMembers.length >= MASS_MENTION_THRESHOLD) {
        registerMassMentionUse(from);
      }

      let msg = `📢 *Membros mencionados:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
      return await nazu.sendMessage(from, { 
        text: msg + membros.map(m => `👉 @${getUserName(m)}`).join('\n'), 
        mentions: membros 
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ MENCIONAR/LISTAR ADMINS
    // ═══════════════════════════════════════════════════════════════
    if (['admin', 'adm', 'adms', 'admins', 'listadm', 'listadms', 'listadministradores', 'totais', 'totaisadms'].includes(cmd)) {
      let text = `🛡️ *ADMINISTRADORES DO GRUPO*\n\n💬 *Mensagem:* ${q || 'Nenhuma'}\n👤 *Por:* ${pushname}\n\n`;
      for (let adm of groupAdmins) {
        text += `• @${adm.split('@')[0]}\n`;
      }
      text += `\n📊 *Total:* ${groupAdmins.length}`;
      return await nazu.sendMessage(from, { text, mentions: groupAdmins });
    }
  }
};
