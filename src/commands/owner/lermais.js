import { isMenuLerMaisEnabled, setMenuLerMais } from '../../utils/database.js';

export default {
  name: "lermais",
  description: "Ativa/desativa o 'Ler Mais' nos menus do bot",
  commands: ["lermais", "lermaismenus", "menulermais"],
  usage: `${global.prefixo}lermais`,
  handle: async ({ 
    reply,
    isOwner
  , MESSAGES }) => {
    try {
      const currentState = isMenuLerMaisEnabled();
      const newState = setMenuLerMais(!currentState);
      
      const statusMsg = newState
        ? MESSAGES.owner.lermais.enabled
        : MESSAGES.owner.lermais.disabled;
      
      await reply(statusMsg);
    } catch (e) {
      console.error('Erro no comando lermais:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
