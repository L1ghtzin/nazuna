import { isGroupCustomizationEnabled, setGroupCustomizationEnabled } from '../../utils/database.js';

export default {
  name: "personalizargrupo_global",
  description: "Ativa ou desativa a personalizacao por grupo",
  commands: ["ativarperso", "personalizargrupo"],
  handle: async ({ reply, MESSAGES }) => {
    const newState = setGroupCustomizationEnabled(!isGroupCustomizationEnabled());
    return reply(MESSAGES.owner.personalizargrupo.toggle(newState));
  }
};
