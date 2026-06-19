import pathz from 'path';
import { handleAntistealthCommand, handleAntipaymentCommand } from '../../middleware/antiStealth.js';

export default {
  name: "extra_protections",
  description: "Proteções adicionais (Anti-Link, Anti-Porn, Anti-Gore, Anti-Stealth, Anti-Pagamento)",
  commands: ["antilinkgp", "antilinkcanal", "antilinkch", "antilinksoft", "antiporn", "antigore", "antistealth", "antipagamento", "antipayment"],
  handle: async ({ 
    reply, command, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, optimizer, MESSAGES, args, prefix, bot
  }) => {

    const cmd = command.toLowerCase();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);

    // --- ANTIPORN ---
    if (cmd === 'antiporn') {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      groupData.antiporn = !groupData.antiporn;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(groupData.antiporn 
        ? MESSAGES.admin.extra_protections.antipornOn 
        : MESSAGES.admin.extra_protections.antipornOff);
    }

    // --- ANTIGORE ---
    if (cmd === 'antigore') {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      groupData.antigore = !groupData.antigore;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(groupData.antigore 
        ? MESSAGES.admin.extra_protections.antigoreOn 
        : MESSAGES.admin.extra_protections.antigoreOff);
    }

    // --- ANTI-STEALTH (configurável) ---
    if (cmd === 'antistealth') {
      return handleAntistealthCommand({ 
        reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
        groupData, DATABASE_DIR, optimizer, MESSAGES, prefix, ChainySock: bot 
      });
    }

    // --- ANTI-PAGAMENTO (configurável) ---
    if (['antipagamento', 'antipayment'].includes(cmd)) {
      return handleAntipaymentCommand({ 
        reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
        groupData, DATABASE_DIR, optimizer, MESSAGES, prefix, ChainySock: bot 
      });
    }

    // --- ANTILINK GP/CANAL ---
    if (['antilinkgp', 'antilinkcanal', 'antilinkch', 'antilinksoft'].includes(cmd)) {
      let key = cmd;
      if (cmd === 'antilinkch') key = 'antilinkcanal';
      
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      groupData[key] = !groupData[key];
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      
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
