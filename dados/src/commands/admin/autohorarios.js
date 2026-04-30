import fs from 'fs';

export default {
  name: "autohorarios",
  description: "Gerencia o envio automático de horários pagantes",
  commands: ["autohorarios"],
  usage: `${global.prefix}autohorarios <on|off|status|link>`,
  handle: async ({ reply, isOwner, isGroupAdmin, args, prefix, from }) => {
    if (!isOwner && !isGroupAdmin) return reply('⚠️ Este comando é apenas para administradores!');
    
    try {
      const action = args[0]?.toLowerCase();
      
      if (!action || (action !== 'on' && action !== 'off' && action !== 'status' && action !== 'link')) {
        const helpText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
        `┃   🤖 *AUTO HORÁRIOS*     ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
        `📋 *Comandos disponíveis:*\n\n` +
        `🟢 \`${prefix}autohorarios on\`\n` +
        `   ▸ Liga o envio automático\n\n` +
        `🔴 \`${prefix}autohorarios off\`\n` +
        `   ▸ Desliga o envio automático\n\n` +
        `📊 \`${prefix}autohorarios status\`\n` +
        `   ▸ Verifica status atual\n\n` +
        `🔗 \`${prefix}autohorarios link [URL]\`\n` +
        `   ▸ Define link de apostas\n` +
        `   ▸ Sem URL remove o link\n\n` +
        `⏰ *Funcionamento:*\n` +
        `• Envia horários a cada hora\n` +
        `• Apenas em grupos\n` +
        `• Inclui link se configurado\n\n` +
        `🔒 *Restrito a administradores*`;
        
        await reply(helpText);
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
          await reply('✅ *Auto horários ativado!*\n\n📤 Os horários pagantes serão enviados automaticamente a cada hora.\n\n⚡ O primeiro envio será na próxima hora cheia.');
          break;
          
        case 'off':
          autoSchedules[from].enabled = false;
          fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
          await reply('🔴 *Auto horários desativado!*\n\n📴 Os envios automáticos foram interrompidos.');
          break;
          
        case 'status': {
          const config = autoSchedules[from];
          const statusEmoji = config.enabled ? '🟢' : '🔴';
          const statusText = config.enabled ? 'ATIVO' : 'INATIVO';
          const linkStatus = config.link ? `🔗 ${config.link}` : '🚫 Nenhum link configurado';
          
          const statusResponse = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
           `┃   📊 *STATUS AUTO HORÁRIOS*  ┃\n` +
           `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
           `${statusEmoji} *Status:* ${statusText}\n\n` +
           `🔗 *Link:*\n${linkStatus}\n\n` +
           `⏰ *Próximo envio:*\n${config.enabled ? 'Na próxima hora cheia' : 'Desativado'}`;
          
          await reply(statusResponse);
          break;
        }
          
        case 'link': {
          const linkUrl = args.slice(1).join(' ').trim();
          
          if (!linkUrl) {
            autoSchedules[from].link = null;
            fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
            await reply('🗑️ *Link removido!*\n\n📝 Os horários automáticos não incluirão mais link de apostas.');
          } else {
            autoSchedules[from].link = linkUrl;
            fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
            await reply(`✅ *Link configurado!*\n\n🔗 *URL:* ${linkUrl}\n\n📝 Este link será incluído nos horários automáticos.`);
          }
          break;
        }
      }
      
    } catch (e) {
      console.error('Erro no comando autohorarios:', e);
      await reply('❌ Ocorreu um erro ao configurar os horários automáticos.');
    }
  }
};
