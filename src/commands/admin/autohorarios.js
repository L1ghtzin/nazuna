import fs from 'fs';

export default {
  name: "autohorarios",
  description: "Gerencia o envio automático de horários pagantes",
  commands: ["autohorarios"],
  usage: `${global.prefix}autohorarios <on|off|status|link>`,
  handle: async ({ reply, isOwner, isGroupAdmin, args, prefix, from, MESSAGES }) => {
    if (!isOwner && !isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
    
    try {
      const action = args[0]?.toLowerCase();
      
      if (!action || (action !== 'on' && action !== 'off' && action !== 'status' && action !== 'link')) {
        await reply(MESSAGES.admin.autohorarios.helpText(prefix));
        return;
      }
      
      let autoSchedules = {};
      const autoSchedulesPath = './dados/database/autohorarios.json';
      try {
        if (fs.existsSync(autoSchedulesPath)) {
          autoSchedules = JSON.parse(fs.readFileSync(autoSchedulesPath, 'utf8'));
        }
      } catch (e) {
        autoSchedules = {};
      }
      
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
          fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
          await reply(MESSAGES.admin.autohorarios.activated);
          break;
          
        case 'off':
          autoSchedules[from].enabled = false;
          fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
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
            fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
            await reply(MESSAGES.admin.autohorarios.linkRemoved);
          } else {
            autoSchedules[from].link = linkUrl;
            fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
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
