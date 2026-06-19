import path from 'path';
import fs from 'fs';

export default {
  name: "reviverqr",
  description: "Limpa arquivos de sessão corrompidos para resolver erros de Bad MAC sem deslogar",
  commands: ["reviverqr", "fixsession", "clearsession"],
  usage: `${global.prefixo}reviverqr`,
  handle: async ({ 
    reply,
    isOwner,
    MESSAGES
  }) => {
    try {
      const authDir = path.join(process.cwd(), 'dados', 'database', 'qr-code');
      const filePatterns = ['pre-key', 'sender', 'session', 'app-state'];
      let totalDeleted = 0;
      const deletedByCategory = {};
      
      filePatterns.forEach(pattern => deletedByCategory[pattern] = 0);
      
      if (!fs.existsSync(authDir)) {
        return reply(MESSAGES.owner.reviverqr.notFound);
      }

      await reply(MESSAGES.owner.reviverqr.start);

      const files = fs.readdirSync(authDir);
      for (const file of files) {
        // NUNCA deletar o creds.json
        if (file === 'creds.json') continue;

        for (const pattern of filePatterns) {
          if (file.startsWith(pattern)) {
            const filePath = path.join(authDir, file);
            fs.unlinkSync(filePath);
            deletedByCategory[pattern]++;
            totalDeleted++;
          }
        }
      }

      if (totalDeleted > 0) {
        let listStr = "";
        for (const [category, count] of Object.entries(deletedByCategory)) {
          if (count > 0) listStr += MESSAGES.owner.reviverqr.reportItem(category, count);
        }
        
        let report = MESSAGES.owner.reviverqr.report(listStr, totalDeleted);
        
        await reply(report);
        
        setTimeout(() => {
          if (process.env.DEBUG_MODE === 'true') {
            console.log('[REVIVERQR] Reiniciando bot após limpeza de sessão...');
          }
          process.exit(0);
        }, 3000);
      } else {
        await reply(MESSAGES.owner.reviverqr.clean);
      }
      
    } catch (e) {
      console.error('[REVIVERQR ERROR]', e);
      reply(MESSAGES.owner.reviverqr.error(e.message));
    }
  }
};
