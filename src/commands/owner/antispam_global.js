import { writeAsync } from '../../utils/database/io.js';
export default {
  name: "antispam_global",
  description: "Comandos de configuração do anti-spam global",
  commands: ["antispamcmd"],
  handle: async ({ 
    prefix, q, reply, DATABASE_DIR, antiSpamGlobal, MESSAGES 
  }) => {
    const filePath = DATABASE_DIR + '/antispam.json';
    const cfg = antiSpamGlobal || {};
    const parts = q.trim().split(/\s+/);
    const sub = parts[0]?.toLowerCase();

    if (!q) return reply(MESSAGES.owner.owner_broadcast.antispamcmd.usage(prefix));

    if (sub === 'status') {
      return reply(MESSAGES.owner.owner_broadcast.antispamcmd.status(
        cfg.enabled ? '✅ Ativo' : '💔 Inativo', 
        cfg.limit, 
        cfg.interval, 
        Math.floor(cfg.blockTime / 60)
      ));
    }
    if (sub === 'off') {
      cfg.enabled = false;
      await writeAsync(filePath, cfg);
      return reply(MESSAGES.owner.owner_broadcast.antispamcmd.off);
    }
    if (sub === 'on') {
      const [l, i, b] = parts.slice(1).map(v => parseInt(v));
      if ([l, i, b].some(isNaN)) return reply(MESSAGES.owner.owner_broadcast.antispamcmd.usage(prefix));
      Object.assign(cfg, { enabled: true, limit: l, interval: i, blockTime: b });
      await writeAsync(filePath, cfg);
      return reply(MESSAGES.owner.owner_broadcast.antispamcmd.on);
    }
    return reply(MESSAGES.owner.owner_broadcast.antispamcmd.usage(prefix));
  }
};
