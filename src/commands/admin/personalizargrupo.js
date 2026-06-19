import {
  isGroupCustomizationEnabled,
  getGroupCustomization,
  setGroupCustomName,
  setGroupCustomPhoto,
  removeGroupCustomName,
  removeGroupCustomPhoto
} from '../../utils/database.js';

export default {
  name: "personalizargrupo",
  description: "Personalizacao de menu por grupo",
  commands: ["fotomenugrupo", "infoperso", "nomebotgrupo", "nomegrupo", "personalizacao", "removerfotomenu", "removernome", "resetfotomenu", "resetnome", "setbotname", "setmenupic"],
  handle: async ({
    from, info, command, q, reply, prefix,
    isQuotedImage, isImage, getFileBuffer, upload, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (['infoperso', 'personalizacao'].includes(cmd)) {
      const customization = getGroupCustomization(from);
      return reply(MESSAGES.owner.personalizargrupo.info(
        isGroupCustomizationEnabled() ? 'Ativo' : 'Inativo',
        customization?.customName || 'Padrao',
        customization?.customPhoto ? 'Personalizada' : 'Padrao',
        prefix
      ));
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
        const imageMessage = isQuotedImage
          ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
          : info.message.imageMessage;
        const media = await getFileBuffer(imageMessage, 'image');
        const url = await upload(media);
        setGroupCustomPhoto(from, url);
        return reply(MESSAGES.owner.personalizargrupo.photo.success);
      } catch {
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
