import pathz from 'path';
import { readJsonFileAsync } from '../../utils/asyncFs.js';

export default {
  name: "indication_rank",
  description: "Ranking de indicacoes e recomendacoes",
  commands: ["topindica", "topindicacao", "rankindicacao", "rankindicacoes"],
  handle: async ({ reply, DATABASE_DIR, MESSAGES }) => {
    const filePath = pathz.join(DATABASE_DIR, 'indicacoes.json');
    const data = await readJsonFileAsync(filePath, { users: {} });
    data.users = data.users || {};

    const users = Object.entries(data.users)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    if (users.length === 0) return reply(MESSAGES.member.indications.empty);

    let text = MESSAGES.member.indications.rankingHeader;
    users.forEach(([id, info], index) => {
      text += `${index + 1}. @${id.split('@')[0]} - ${info.count} indicacoes\n`;
    });

    return reply(text, { mentions: users.map(([id]) => id) });
  }
};
