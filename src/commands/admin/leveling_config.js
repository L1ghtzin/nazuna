import { writeAsync } from '../../utils/database/io.js';
export default {
  name: "leveling_config",
  description: "Ativa ou desativa o sistema de leveling do grupo",
  commands: ["leveling"],
  handle: async ({ groupData, groupFile, reply, MESSAGES }) => {
    groupData.levelingEnabled = !groupData.levelingEnabled;
    await writeAsync(groupFile, groupData);
    return reply(MESSAGES.member.leveling.toggled(groupData.levelingEnabled));
  }
};
