

export default {
  name: "owner_group_mgmt",
  description: "Gerenciamento de grupos pelo dono",
  commands: ["listagp", "listgp", "listbangp", "bangp", "unbangp", "desbangp", "listblocksgp", "blocklist", "modoliteglobal"],
  handle: async ({ 
    bot, from, command, reply, isOwner, isGroup,
    optimizer, banGpIds, getCachedGroupMetadata, DATABASE_DIR, fs, __dirname
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
      const banned = Object.keys(banGpIds || {}).filter(id => banGpIds[id]);
      if (!banned.length) return reply(MESSAGES.owner.owner_group_mgmt.listbangp.empty);
      let teks = MESSAGES.owner.owner_group_mgmt.listbangp.header(banned.length);
      for (const id of banned) {
        const meta = await getCachedGroupMetadata(id).catch(() => null);
        teks += MESSAGES.owner.owner_group_mgmt.listbangp.item(meta?.subject || 'Desconhecido', id);
      }
      return reply(teks);
    }

    if (['bangp', 'unbangp', 'desbangp'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      banGpIds[from] = !banGpIds[from];
      const filePath = DATABASE_DIR + `/dono/bangp.json`;
      await optimizer.saveJsonWithCache(filePath, banGpIds);
      return reply(banGpIds[from] ? MESSAGES.owner.owner_group_mgmt.bangp.banned : MESSAGES.owner.owner_group_mgmt.bangp.unbanned);
    }
  }
};
