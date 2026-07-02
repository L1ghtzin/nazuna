import { writeJsonFileAsync } from '../../utils/asyncFs.js';
export default {
  name: "leveling_config",
  description: "Ativa ou desativa o sistema de leveling do grupo",
  commands: ["leveling"],
  handle: async ({ groupData, groupFile, reply, MESSAGES }) => {
    groupData.levelingEnabled = !groupData.levelingEnabled;
    await writeJsonFileAsync(groupFile, groupData);
    return reply(MESSAGES.member.leveling.toggled(groupData.levelingEnabled));
  }
};
