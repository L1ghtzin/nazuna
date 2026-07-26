import { startWatcher } from '../../connect.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WATCHER_AUTH_DIR = path.join(__dirname, '..', '..', '..', 'dados', 'database', 'watcher-qr-code');

export default {
  name: "watcher",
  description: "Gerencia a conexão do Sensor Watcher (Sombra)",
  commands: ["watcher", "sensor"],
  usage: "{prefix}watcher [status | parear <numero> | reset]",
  handle: async ({
    bot,
    from,
    info,
    reply,
    args
  }) => {
    const subcmd = args[0]?.toLowerCase();

    if (!subcmd || subcmd === 'status') {
      const isOnline = global.sockWatcher && global.sockWatcher.ws?.isOpen;
      const statusText = isOnline 
        ? "✅ *ONLINE* e vigiando o grupo contra travas/pagamentos."
        : "❌ *DESCONECTADO* ou inativo.";

      let msg = `👁️ *[STATUS DO SENSOR WATCHER]*\n\n`;
      msg += `📌 *Estado:* ${statusText}\n\n`;
      msg += `💡 *Subcomandos disponíveis:*\n`;
      msg += `👉 */watcher status* - Mostra este painel\n`;
      msg += `👉 */watcher parear <número>* - Pareia um número secundário para atuar como sensor (Ex: /watcher parear 559299999999)\n`;
      msg += `👉 */watcher reset* - Desconecta o sensor e apaga a sessão atual`;
      
      return reply(msg);
    }

    if (subcmd === 'parear') {
      const number = args[1];
      if (!number || !/^\d{10,15}$/.test(number.replace(/\D/g, ''))) {
        return reply('❌ Por favor, informe um número de telefone válido com código de país (Ex: /watcher parear 5592999999999).');
      }

      const cleanNum = number.replace(/\D/g, '');
      const isOnline = global.sockWatcher && global.sockWatcher.ws?.isOpen;
      if (isOnline) {
        return reply('⚠️ O Sensor já está conectado e operando! Se deseja parear outro número, use primeiro */watcher reset*.');
      }

      reply('⏳ Solicitando código de pareamento do Sensor... O código será enviado no seu chat privado em alguns segundos.');
      
      try {
        const ownerPrivateJid = info.key.participant || info.participant || info.key.remoteJid;
        await startWatcher(true, cleanNum, ownerPrivateJid);
      } catch (err) {
        reply(`❌ Erro ao iniciar pareamento: ${err.message}`);
      }
      return;
    }

    if (subcmd === 'reset') {
      reply('⏳ Desconectando Sensor e limpando credenciais de sessão...');

      try {
        if (global.sockWatcher) {
          global.sockWatcher.end(undefined);
          global.sockWatcher = null;
        }

        const credsPath = path.join(WATCHER_AUTH_DIR, 'creds.json');
        if (fs.existsSync(credsPath)) {
          fs.rmSync(WATCHER_AUTH_DIR, { recursive: true, force: true });
          reply('🗑️ Credenciais de sessão do Sensor apagadas com sucesso!');
        } else {
          reply('ℹ️ Nenhuma credencial de sessão do Sensor foi encontrada no servidor.');
        }
      } catch (err) {
        reply(`❌ Erro ao resetar o Sensor: ${err.message}`);
      }
      return;
    }

    return reply(`❌ Subcomando inválido! Use */watcher status*, */watcher parear <número>* ou */watcher reset*.`);
  },
};
