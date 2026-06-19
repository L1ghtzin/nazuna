export default {
  name: "leveling_config",
  description: "Ativa ou desativa o sistema de leveling do grupo",
  commands: ["leveling"],
  handle: async ({ groupData, groupFile, optimizer, reply, MESSAGES }) => {
    groupData.levelingEnabled = !groupData.levelingEnabled;
    await optimizer.saveJsonWithCache(groupFile, groupData);
    return reply(MESSAGES.member.leveling.toggled(groupData.levelingEnabled));
  }
};
