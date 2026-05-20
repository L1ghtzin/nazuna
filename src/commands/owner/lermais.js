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
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      
      const currentState = isMenuLerMaisEnabled();
      const newState = setMenuLerMais(!currentState);
      
      const statusMsg = newState
        ? `✅ *"Ler Mais" ATIVADO nos menus!*\n\n` +
          `📱 Os menus agora exibem caracteres invisíveis no início, fazendo o WhatsApp mostrar "Ler mais".\n\n` +
          `💡 Isso deixa os menus mais limpos na prévia da conversa.`
        : `💔 *"Ler Mais" DESATIVADO nos menus!*\n\n` +
          `📱 Os menus não terão mais os caracteres invisíveis.\n\n` +
          `💡 O conteúdo completo aparecerá direto sem precisar expandir.`;
      
      await reply(statusMsg);
    } catch (e) {
      console.error('Erro no comando lermais:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
