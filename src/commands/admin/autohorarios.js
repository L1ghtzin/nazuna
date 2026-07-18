import { AUTO_HORARIOS_FILE } from '../../utils/paths.js';
import { readAsync, writeAsync } from '../../utils/database/io.js';

export default {
  name: "autohorarios",
  description: "Gerencia o envio automático de horários pagantes",
  commands: ["autohorarios"],
  usage: `${global.prefix}autohorarios <on|off|status|link>`,
  handle: async ({ reply, args, prefix, from, MESSAGES }) => {
    try {
      const action = args[0]?.toLowerCase();
      
      if (!action || (action !== 'on' && action !== 'off' && action !== 'status' && action !== 'link')) {
        await reply(MESSAGES.admin.autohorarios.helpText(prefix));
        return;
      }
      
      const autoSchedules = await readAsync(AUTO_HORARIOS_FILE, {});
      
      if (!autoSchedules[from]) {
        autoSchedules[from] = {
          enabled: false,
          link: null,
          lastSent: 0
        };
      }
      
      switch (action) {
        case 'on':
          autoSchedules[from].enabled = true;
          await writeAsync(AUTO_HORARIOS_FILE, autoSchedules);
          await reply(MESSAGES.admin.autohorarios.activated);
          break;
          
        case 'off':
          autoSchedules[from].enabled = false;
          await writeAsync(AUTO_HORARIOS_FILE, autoSchedules);
          await reply(MESSAGES.admin.autohorarios.deactivated);
          break;
          
        case 'status': {
          const config = autoSchedules[from];
          const statusResponse = MESSAGES.admin.autohorarios.status(config.enabled, config.link);
          await reply(statusResponse);
          break;
        }
          
        case 'link': {
          const linkUrl = args.slice(1).join(' ').trim();
          
          if (!linkUrl) {
            autoSchedules[from].link = null;
            await writeAsync(AUTO_HORARIOS_FILE, autoSchedules);
            await reply(MESSAGES.admin.autohorarios.linkRemoved);
          } else {
            autoSchedules[from].link = linkUrl;
            await writeAsync(AUTO_HORARIOS_FILE, autoSchedules);
            await reply(MESSAGES.admin.autohorarios.linkConfigured(linkUrl));
          }
          break;
        }
      }
      
    } catch (e) {
      console.error('Erro no comando autohorarios:', e);
      await reply(MESSAGES.admin.autohorarios.error);
    }
  }
};
