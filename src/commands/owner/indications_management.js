import pathz from 'path';
import { readAsync, writeAsync } from '../../utils/database/io.js';

export default {
  name: "indication_management",
  description: "Gerenciamento de indicacoes",
  commands: ["addindicacao", "addindicar", "addindica", "delindicacao", "rmindicacao", "removerindicacao"],
  handle: async ({ reply, command, menc_os2, DATABASE_DIR, getUserName, MESSAGES }) => {
    const cmd = command.toLowerCase();
    const filePath = pathz.join(DATABASE_DIR, 'indicacoes.json');
    const data = await readAsync(filePath, { users: {} });
    data.users = data.users || {};

    if (cmd.startsWith('add')) {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguem'));

      if (!data.users[menc_os2]) {
        data.users[menc_os2] = { count: 0, addedBy: [], createdAt: new Date().toISOString() };
      }

      data.users[menc_os2].count += 1;
      await writeAsync(filePath, data);
      return reply(MESSAGES.member.indications.addSuccess(getUserName(menc_os2), data.users[menc_os2].count), { mentions: [menc_os2] });
    }

    if (!menc_os2 || !data.users[menc_os2]) return reply(MESSAGES.member.indications.userNotFound);

    delete data.users[menc_os2];
    await writeAsync(filePath, data);
    return reply(MESSAGES.member.indications.removeSuccess);
  }
};
