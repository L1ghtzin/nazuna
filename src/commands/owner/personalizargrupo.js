import { isGroupCustomizationEnabled, setGroupCustomizationEnabled, getGroupCustomization, setGroupCustomName, setGroupCustomPhoto, removeGroupCustomName, removeGroupCustomPhoto } from '../../utils/database.js';

export default {
  name: "personalizargrupo",
  description: "Sistema de personalização de grupo (Dono e Admins)",
  commands: ["ativarperso", "fotomenugrupo", "infoperso", "nomebotgrupo", "nomegrupo", "personalizacao", "personalizargrupo", "removerfotomenu", "removernome", "resetfotomenu", "resetnome", "setbotname", "setmenupic"],
  handle: async ({ 
    bot, from, info, command, q, reply, isOwner, isGroup, isGroupAdmin, prefix,
    isQuotedImage, isImage, getFileBuffer, upload
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 👑 DONO (ATIVAR/DESATIVAR)
    // ═══════════════════════════════════════════════════════════════
    if (['personalizargrupo', 'ativarperso'].includes(cmd)) {
      const newState = setGroupCustomizationEnabled(!isGroupCustomizationEnabled());
      return reply(MESSAGES.owner.personalizargrupo.toggle(newState));
    }

    // ═══════════════════════════════════════════════════════════════
    // 👥 ADMINS DO GRUPO (PERSONALIZAR)
    // ═══════════════════════════════════════════════════════════════
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);

    if (['infoperso', 'personalizacao'].includes(cmd)) {
      const customization = getGroupCustomization(from);
      return reply(MESSAGES.owner.personalizargrupo.info(isGroupCustomizationEnabled() ? '✅ Ativo' : `💔 Inativo`, customization?.customName || 'Padrão', customization?.customPhoto ? '✅ Personalizada' : `💔 Padrão`, prefix));
    }

    if (!isGroupCustomizationEnabled()) return reply(MESSAGES.owner.personalizargrupo.disabled);

    if (['nomegrupo', 'nomebotgrupo', 'setbotname'].includes(cmd)) {
      if (!q) return reply(MESSAGES.owner.personalizargrupo.name.usage(prefix, cmd));
      setGroupCustomName(from, q);
      return reply(MESSAGES.owner.personalizargrupo.name.success(q));
    }

    if (['fotomenugrupo', 'setmenupic'].includes(cmd)) {
      if (!isQuotedImage && !isImage) return reply(MESSAGES.owner.personalizargrupo.photo.missingMedia);
      try {
        const media = await getFileBuffer(isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage, 'image');
        const url = await upload(media);
        setGroupCustomPhoto(from, url);
        return reply(MESSAGES.owner.personalizargrupo.photo.success);
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    if (['removernome', 'resetnome'].includes(cmd)) {
      removeGroupCustomName(from);
      return reply(MESSAGES.owner.personalizargrupo.resetName);
    }

    if (['removerfotomenu', 'resetfotomenu'].includes(cmd)) {
      removeGroupCustomPhoto(from);
      return reply(MESSAGES.owner.personalizargrupo.resetPhoto);
    }
  }
};
