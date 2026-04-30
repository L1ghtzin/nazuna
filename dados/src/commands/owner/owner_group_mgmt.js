import { PREFIX } from "../../config.js";

export default {
  name: "owner_group_mgmt",
  description: "Gerenciamento de grupos pelo dono",
  commands: ["listagp", "listgp", "listbangp", "bangp", "unbangp", "desbangp", "listblocksgp", "blocklist", "modoliteglobal"],
  handle: async ({ 
    nazu, from, command, reply, isOwner, isGroup,
    optimizer, banGpIds, getCachedGroupMetadata, DATABASE_DIR, fs, __dirname
  , MESSAGES }) => {
    if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

    const cmd = command.toLowerCase();

    if (['listagp', 'listgp'].includes(cmd)) {
      const getGroups = await nazu.groupFetchAllParticipating();
      const groups = Object.values(getGroups).sort((a, b) => a.subject.localeCompare(b.subject));
      let teks = `🌟 *LISTA DE GRUPOS* (${groups.length})\n\n`;
      groups.forEach((g, i) => {
        teks += `${i + 1}. ${g.subject}\n🆔 ${g.id}\n\n`;
      });
      return reply(teks);
    }

    if (cmd === 'listbangp') {
      const banned = Object.keys(banGpIds || {}).filter(id => banGpIds[id]);
      if (!banned.length) return reply("✅ Nenhum grupo banido.");
      let teks = `🚫 *GRUPOS BANIDOS* (${banned.length})\n\n`;
      for (const id of banned) {
        const meta = await getCachedGroupMetadata(id).catch(() => null);
        teks += `🔹 ${meta?.subject || 'Desconhecido'}\n🆔 ${id}\n\n`;
      }
      return reply(teks);
    }

    if (['bangp', 'unbangp', 'desbangp'].includes(cmd)) {
      if (!isGroup) return reply("Use no grupo!");
      banGpIds[from] = !banGpIds[from];
      const filePath = DATABASE_DIR + `/dono/bangp.json`;
      await optimizer.saveJsonWithCache(filePath, banGpIds);
      return reply(banGpIds[from] ? "🚫 Grupo banido!" : "✅ Grupo desbanido!");
    }
  }
};
