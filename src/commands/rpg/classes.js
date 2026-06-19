
export default {
  name: "classe",
  description: "Sistema de classes e profissões",
  commands: ["class", "classe", "lar", "profissao", "raid"],
  usage: "{prefix}classe",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    const classes = {
      'guerreiro': { name: 'Guerreiro', emoji: '⚔️' },
      'mago': { name: 'Mago', emoji: '🧙' },
      'arqueiro': { name: 'Arqueiro', emoji: '🏹' },
      'ladino': { name: 'Ladino', emoji: '🗡️' }
    };

    if (!args[0]) {
      let text = MESSAGES.rpg.classes.header;
      Object.entries(classes).forEach(([id, c]) => {
        text += MESSAGES.rpg.classes.itemLine(c.emoji, c.name, prefix, id);
      });
      return reply(text);
    }
    
    const choice = args[0].toLowerCase();
    if (!classes[choice]) return reply(MESSAGES.rpg.classes.notFound);
    
    me.classe = choice;
    saveEconomy(econ);
    return reply(MESSAGES.rpg.classes.chosen(classes[choice].name));
  }
};
