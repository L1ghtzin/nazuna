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
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      
      const authDir = path.join(process.cwd(), 'dados', 'database', 'qr-code');
      const filePatterns = ['pre-key', 'sender', 'session', 'app-state'];
      let totalDeleted = 0;
      const deletedByCategory = {};
      
      filePatterns.forEach(pattern => deletedByCategory[pattern] = 0);
      
      if (!fs.existsSync(authDir)) {
        return reply('❌ Pasta de autenticação não encontrada.');
      }

      await reply(`🧹 *INICIANDO LIMPEZA DE SESSÃO (PADRÃO TOKYO)...*\n\nRemovendo arquivos temporários para resolver erros de 'Bad MAC' mantendo o login ativo.\n\n⏳ Aguarde...`);

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
        let report = `✅ *LIMPEZA CONCLUÍDA!*\n\n`;
        report += `📊 *Arquivos removidos:*\n`;
        for (const [category, count] of Object.entries(deletedByCategory)) {
          if (count > 0) report += `└─ ${category}: ${count}\n`;
        }
        report += `\n📈 *Total:* ${totalDeleted}\n`;
        report += `\n🔄 *O bot será reiniciado em 3 segundos para aplicar as mudanças.*`;
        
        await reply(report);
        
        setTimeout(() => {
          console.log('[REVIVERQR] Reiniciando bot após limpeza de sessão...');
          process.exit(0);
        }, 3000);
      } else {
        await reply(`ℹ️ *Nenhum arquivo problemático encontrado.* \n\nA sessão parece estar limpa.`);
      }
      
    } catch (e) {
      console.error('[REVIVERQR ERROR]', e);
      reply(`❌ Erro ao limpar sessão: ${e.message}`);
    }
  }
};
