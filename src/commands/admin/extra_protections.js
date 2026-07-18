import pathz from 'path';
import { 
  hasActiveStealthTimer, 
  clearActiveStealthTimer, 
  describeAction, 
  isValidAction, 
  getStealthConfig 
} from '../../middleware/antiStealth.js';
import { writeAsync } from '../../utils/database/io.js';

async function toggleAntiStealthStatus(sub, from, groupData, groupFilePath, reply, prefix, config, MESSAGES) {
    if (sub === 'on') groupData.antistealth = true;
    else if (sub === 'off') groupData.antistealth = false;
    else groupData.antistealth = !groupData.antistealth;

    await writeAsync(groupFilePath, groupData);
    
    return reply(groupData.antistealth 
        ? MESSAGES.middleware.antiStealth.activated(describeAction(config.action), prefix)
        : MESSAGES.middleware.antiStealth.desactivated);
}

function showAntiStealthStatus(groupData, config, from, reply, MESSAGES) {
    const status = groupData.antistealth ? '✅ Ativado' : '❌ Desativado';
    const timerAtivo = hasActiveStealthTimer(from) ? '\n⏱️ Timer de reabertura ativo' : '';
    
    return reply(
        MESSAGES.middleware.antiStealth.statusTitle +
        MESSAGES.middleware.antiStealth.statusBody(status, config.action, timerAtivo, config.limit || 1, describeAction(config.action), config.stats)
    );
}

async function configureAntiStealthAction(val, from, groupData, groupFilePath, reply, ChainySock, prefix, config, MESSAGES) {
    if (val === 'abrir') {
        try {
            clearActiveStealthTimer(from);
            await ChainySock.groupSettingUpdate(from, 'not_announcement');
            return reply(MESSAGES.middleware.antiStealth.groupOpened);
        } catch (e) {
            return reply(MESSAGES.middleware.antiStealth.openError(e.message));
        }
    }

    if (!val || !isValidAction(val)) {
        return reply(MESSAGES.middleware.antiStealth.configActionMenu(prefix));
    }

    config.action = val;
    await writeAsync(groupFilePath, groupData);
    
    return reply(MESSAGES.middleware.antiStealth.actionConfigured(val, describeAction(val)));
}

async function configureAntiStealthStrikes(val, from, groupData, groupFilePath, reply, prefix, config, MESSAGES) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 10) {
        return reply(MESSAGES.middleware.antiStealth.configStrikesMenu(prefix, config.limit || 3));
    }

    config.limit = num;
    await writeAsync(groupFilePath, groupData);

    return reply(MESSAGES.middleware.antiStealth.strikesConfigured(num));
}

async function handleAntistealthCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, MESSAGES, prefix, ChainySock 
}) {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
    if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

    const sub = args[0]?.toLowerCase() || '';
    const val = args.slice(1).join(' ').toLowerCase().trim();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);
    
    // Ensure config exists before reading/writing
    const config = getStealthConfig(groupData);

    switch (sub) {
        case '':
        case 'on':
        case 'off':
            return await toggleAntiStealthStatus(sub, from, groupData, groupFilePath, reply, prefix, config, MESSAGES);
        case 'status':
            return showAntiStealthStatus(groupData, config, from, reply, MESSAGES);
        case 'acao':
        case 'ação':
        case 'action':
            return await configureAntiStealthAction(val, from, groupData, groupFilePath, reply, ChainySock, prefix, config, MESSAGES);
        case 'strikes':
        case 'limite':
        case 'limit':
            return await configureAntiStealthStrikes(val, from, groupData, groupFilePath, reply, prefix, config, MESSAGES);
        default:
            return reply(MESSAGES.middleware.antiStealth.commandsMenu(prefix));
    }
}

async function handleAntipaymentCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, MESSAGES, prefix, ChainySock 
}) {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
    if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

    const sub = args[0]?.toLowerCase() || '';
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);

    if (sub === 'on' || sub === '1') {
        groupData.antipayment = true;
    } else if (sub === 'off' || sub === '0') {
        groupData.antipayment = false;
    } else if (sub === '') {
        groupData.antipayment = !groupData.antipayment;
    } else {
        return reply(MESSAGES.middleware.antiPaymentCmd.invalidOption(prefix));
    }

    await writeAsync(groupFilePath, groupData);
    
    return reply(groupData.antipayment 
        ? MESSAGES.middleware.antiPaymentCmd.activated
        : MESSAGES.middleware.antiPaymentCmd.deactivated);
}

export default {
  name: "extra_protections",
  description: "Proteções adicionais (Anti-Link, Anti-Stealth, Anti-Pagamento)",
  commands: ["antilinkgp", "antilinkcanal", "antilinkch", "antilinksoft", "antistealth", "antipagamento", "antipayment"],
  handle: async ({ 
    reply, command, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, MESSAGES, args, prefix, bot
  }) => {

    const cmd = command.toLowerCase();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);



    // --- ANTI-STEALTH (configurável) ---
    if (cmd === 'antistealth') {
      return handleAntistealthCommand({ 
        reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
        groupData, DATABASE_DIR, MESSAGES, prefix, ChainySock: bot 
      });
    }

    // --- ANTI-PAGAMENTO (configurável) ---
    if (['antipagamento', 'antipayment'].includes(cmd)) {
      return handleAntipaymentCommand({ 
        reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
        groupData, DATABASE_DIR, MESSAGES, prefix, ChainySock: bot 
      });
    }

    // --- ANTILINK GP/CANAL ---
    if (['antilinkgp', 'antilinkcanal', 'antilinkch', 'antilinksoft'].includes(cmd)) {
      let key = cmd;
      if (cmd === 'antilinkch') key = 'antilinkcanal';
      
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      groupData[key] = !groupData[key];
      await writeAsync(groupFilePath, groupData);
      
      if (key === 'antilinkgp') {
        const message = groupData.antilinkgp 
          ? MESSAGES.admin.extra_protections.antilinkgpOn 
          : MESSAGES.admin.extra_protections.antilinkgpOff;
        return reply(message);
      } else if (key === 'antilinkcanal') {
        const message = groupData.antilinkcanal 
          ? MESSAGES.admin.extra_protections.antilinkcanalOn 
          : MESSAGES.admin.extra_protections.antilinkcanalOff;
        return reply(message);
      } else {
        const status = groupData[key] ? "ATIVADO 🟢" : "DESATIVADO 🔴";
        return reply(MESSAGES.admin.extra_protections.genericStatus(cmd, status));
      }
    }

    return reply(MESSAGES.admin.extra_protections.genericUpdate(cmd));
  }
};
