import { isGroupCustomizationEnabled, setGroupCustomizationEnabled, getGroupCustomization, setGroupCustomName, setGroupCustomPhoto, removeGroupCustomName, removeGroupCustomPhoto } from '../../utils/database.js';

export default {
  name: "personalizargrupo",
  description: "Sistema de personalização de grupo (Dono e Admins)",
  commands: ["ativarperso", "fotomenugrupo", "infoperso", "nomebotgrupo", "nomegrupo", "personalizacao", "personalizargrupo", "removerfotomenu", "removernome", "resetfotomenu", "resetnome", "setbotname", "setmenupic"],
  handle: async ({ 
    nazu, from, info, command, q, reply, isOwner, isGroup, isGroupAdmin, prefix,
    isQuotedImage, isImage, getFileBuffer, upload
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 👑 DONO (ATIVAR/DESATIVAR)
    // ═══════════════════════════════════════════════════════════════
    if (['personalizargrupo', 'ativarperso'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const newState = setGroupCustomizationEnabled(!isGroupCustomizationEnabled());
      return reply(`✅ Sistema de personalização ${newState ? 'ATIVADO' : 'DESATIVADO'}!`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 👥 ADMINS DO GRUPO (PERSONALIZAR)
    // ═══════════════════════════════════════════════════════════════
    if (!isGroup) return reply("Use no grupo!");
    if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);

    if (['infoperso', 'personalizacao'].includes(cmd)) {
      const customization = getGroupCustomization(from);
      let msg = `🎨 *PERSONALIZAÇÃO DO GRUPO*\n\n`;
      msg += `Status Global: ${isGroupCustomizationEnabled() ? '✅ Ativo' : `💔 Inativo`}\n`;
      msg += `Nome: ${customization?.customName || 'Padrão'}\n`;
      msg += `Foto: ${customization?.customPhoto ? '✅ Personalizada' : `💔 Padrão`}\n\n`;
      msg += `Comandos: ${prefix}nomegrupo, ${prefix}fotomenugrupo, ${prefix}removernome, ${prefix}removerfotomenu`;
      return reply(msg);
    }

    if (!isGroupCustomizationEnabled()) return reply("⚠️ O sistema de personalização está desativado pelo dono.");

    if (['nomegrupo', 'nomebotgrupo', 'setbotname'].includes(cmd)) {
      if (!q) return reply(`Uso: ${prefix}${cmd} <nome>`);
      setGroupCustomName(from, q);
      return reply(`✅ Nome do bot alterado para "${q}" neste grupo!`);
    }

    if (['fotomenugrupo', 'setmenupic'].includes(cmd)) {
      if (!isQuotedImage && !isImage) return reply("Envie/marque uma imagem.");
      try {
        const media = await getFileBuffer(isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage, 'image');
        const url = await upload(media);
        setGroupCustomPhoto(from, url);
        return reply("✅ Foto do menu personalizada!");
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    if (['removernome', 'resetnome'].includes(cmd)) {
      removeGroupCustomName(from);
      return reply("✅ Nome resetado para o padrão.");
    }

    if (['removerfotomenu', 'resetfotomenu'].includes(cmd)) {
      removeGroupCustomPhoto(from);
      return reply("✅ Foto resetada para o padrão.");
    }
  }
};
