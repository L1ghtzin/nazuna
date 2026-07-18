import pathz from 'path';
import { writeAsync } from '../../utils/database/io.js';


export default {
  name: "owner_group_mgmt",
  description: "Gerenciamento de grupos pelo dono",
  commands: ["listagp", "listgp", "listbangp", "bangp", "unbangp", "desbangp", "listblocksgp", "blocklist", "modoliteglobal"],
  handle: async ({ 
    bot, from, command, reply, isOwner, isGroup,
    groupData, groupFile, getCachedGroupMetadata, DATABASE_DIR, fs, __dirname
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    if (['listagp', 'listgp'].includes(cmd)) {
      const getGroups = await bot.groupFetchAllParticipating();
      const groups = Object.values(getGroups).sort((a, b) => a.subject.localeCompare(b.subject));
      let teks = MESSAGES.owner.owner_group_mgmt.listgp.header(groups.length);
      groups.forEach((g, i) => {
        teks += MESSAGES.owner.owner_group_mgmt.listgp.item(i + 1, g.subject, g.id);
      });
      return reply(teks);
    }

    if (cmd === 'listbangp') {
      const gruposDir = pathz.join(DATABASE_DIR, 'grupos');
      if (!fs.existsSync(gruposDir)) return reply(MESSAGES.owner.owner_group_mgmt.listbangp.empty);
      const files = fs.readdirSync(gruposDir).filter(f => f.endsWith('.json'));
      const banned = [];
      for (const file of files) {
        try {
          const content = fs.readFileSync(pathz.join(gruposDir, file), 'utf8');
          const data = JSON.parse(content);
          if (data.botBan && data.botBan.ativo) {
            banned.push({ id: file.replace('.json', ''), subject: data.groupName || 'Grupo Desconhecido' });
          }
        } catch (e) {}
      }
      if (!banned.length) return reply(MESSAGES.owner.owner_group_mgmt.listbangp.empty);
      let teks = MESSAGES.owner.owner_group_mgmt.listbangp.header(banned.length);
      banned.forEach((g) => {
        teks += MESSAGES.owner.owner_group_mgmt.listbangp.item(g.subject, g.id);
      });
      return reply(teks);
    }

    if (['bangp', 'unbangp', 'desbangp'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      groupData.botBan = groupData.botBan || {};
      groupData.botBan.ativo = !groupData.botBan.ativo;
      if (groupData.botBan.ativo) {
        groupData.botBan.motivo = 'Banido pelo dono';
        groupData.botBan.createdAt = new Date().toISOString();
        groupData.botBan.createdBy = 'Dono';
      } else {
        groupData.botBan.motivo = null;
        groupData.botBan.createdAt = null;
        groupData.botBan.createdBy = null;
      }
      await writeAsync(groupFile, groupData);
      return reply(groupData.botBan.ativo ? MESSAGES.owner.owner_group_mgmt.bangp.banned : MESSAGES.owner.owner_group_mgmt.bangp.unbanned);
    }
  }
};
