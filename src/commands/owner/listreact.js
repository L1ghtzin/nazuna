import { loadCustomReacts } from "../../utils/database.js";

export default {
  name: "listreact",
  description: "Lista todas as reações automáticas configuradas no bot",
  commands: ["listreact"],
  usage: `${global.prefix}listreact`,
  handle: async ({  reply, isOwner , MESSAGES }) => {
    try {
      const reacts = loadCustomReacts();
      if (reacts.length === 0) return reply(MESSAGES.owner.listreact.empty);
      let listMsg = MESSAGES.owner.listreact.header;
      reacts.forEach(r => {
        listMsg += MESSAGES.owner.listreact.item(r);
      });
      await reply(listMsg);
    } catch (e) {
      console.error('Erro no listreact:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
