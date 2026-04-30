import pathz from 'path';
import fs from 'fs';
import { PREFIX } from "../../config.js";

export default {
  name: "automsg",
  description: "Gerencia o envio automático de mensagens agendadas",
  commands: ["add", "automsg"],
  usage: `${PREFIX}automsg help`,
  handle: async ({ 
    nazu, 
    from, 
    reply, 
    isGroup, 
    isGroupAdmin, 
    isOwner, 
    args, 
    prefix, 
    groupData,
    buildGroupFilePath,
    optimizer,
    quotedMessageContent,
    isQuotedImage,
    isQuotedVideo,
    isQuotedAudio,
    isQuotedSticker,
    isQuotedDocument,
    isQuotedDocW,
    isQuotedVisuU,
    isQuotedVisuU2,
    isQuotedMsg,
    isQuotedMsg2,
    getFileBuffer,
    sender,
    q
  }) => {
    if (!isGroup) return reply("❌ Este comando só pode ser usado em grupos!");
    if (!isGroupAdmin && !isOwner) return reply("❌ Apenas administradores podem usar este comando!");

    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand || subCommand === 'help') {
      return reply(`📨 *Auto Mensagens*
      
Use os subcomandos:
• ${prefix}automsg add HH:MM | descrição - Adicionar (responda à mídia/texto)
• ${prefix}automsg list - Listar mensagens
• ${prefix}automsg del [id] - Remover mensagem
• ${prefix}automsg on/off [id] - Ativar/Desativar mensagem

💡 *Exemplo:* ${prefix}automsg add 08:00 | Bom dia!`);
    }

    const groupFilePath = buildGroupFilePath(from);
    let data = groupData;
    data.autoMessages = data.autoMessages || [];

    // --- ADD ---
    if (subCommand === 'add') {
      if (!q.includes('|')) {
        return reply(`❌ Formato inválido! Use: ${prefix}automsg add HH:MM | descrição`);
      }

      const parts = q.split('|').map(s => s.trim());
      const timeStr = parts[0].split(' ').slice(1).join(' '); // Pega o horário após o "add"
      const description = parts[1] || 'Sem descrição';

      // Validação de horário básica (HH:MM)
      const timeMatch = timeStr.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
      if (!timeMatch) return reply("❌ Horário inválido! Use o formato 24h (ex: 08:30, 22:00).");

      const normalizedTime = timeStr.padStart(5, '0');

      let msgConfig = {
        id: Date.now().toString(),
        time: normalizedTime,
        description: description,
        enabled: true,
        createdAt: new Date().toISOString(),
        createdBy: sender
      };

      if (quotedMessageContent) {
        // Lógica de salvamento de mídia (simplificada para o comando modular)
        // No index.js real, isso salvaria em um diretório específico.
        // Aqui vamos apenas marcar o tipo e conteúdo se for texto, 
        // ou avisar que mídia requer salvamento persistente (geralmente feito por serviços).
        
        if (isQuotedImage || isQuotedVisuU || isQuotedVisuU2) {
          msgConfig.type = 'image';
          msgConfig.caption = quotedMessageContent.imageMessage?.caption || description;
          // O buffer precisaria ser salvo em disco. No Nazuna, 
          // assumimos que o sistema de carregamento cuidará disso.
          return reply("⚠️ Salvamento de mídia para automsg modularizado requer integração com o sistema de arquivos local. Migrando apenas metadados por enquanto.");
        } else if (isQuotedMsg || isQuotedMsg2) {
          msgConfig.type = 'text';
          msgConfig.content = quotedMessageContent.conversation || quotedMessageContent.extendedTextMessage?.text;
        } else {
          return reply("❌ Por enquanto, apenas mensagens de texto e mídia simples são suportadas na migração modular.");
        }
      } else {
        msgConfig.type = 'text';
        msgConfig.content = description;
      }

      data.autoMessages.push(msgConfig);
      await optimizer.saveJsonWithCache(groupFilePath, data);
      
      return reply(`✅ Mensagem automática adicionada para às ${normalizedTime}!`);
    }

    // --- LIST ---
    if (subCommand === 'list' || subCommand === 'lista') {
      if (data.autoMessages.length === 0) return reply("📭 Nenhuma mensagem automática configurada.");
      
      let listMsg = '📨 *Auto Mensagens*\n\n';
      data.autoMessages.forEach((msg, idx) => {
        const status = msg.enabled ? '✅' : '❌';
        listMsg += `${status} *${idx + 1}.* ID: ${msg.id} | ⏰ ${msg.time}\n   📝 ${msg.description}\n\n`;
      });
      return reply(listMsg);
    }

    // --- DELETE ---
    if (subCommand === 'del' || subCommand === 'remover') {
      const id = args[1];
      if (!id) return reply("❌ Informe o ID ou o número da lista.");
      
      const initialCount = data.autoMessages.length;
      if (id.length < 5) { // Provavelmente um índice
        const idx = parseInt(id) - 1;
        if (idx >= 0 && idx < data.autoMessages.length) {
          data.autoMessages.splice(idx, 1);
        }
      } else {
        data.autoMessages = data.autoMessages.filter(m => m.id !== id);
      }

      if (data.autoMessages.length < initialCount) {
        await optimizer.saveJsonWithCache(groupFilePath, data);
        return reply("✅ Mensagem removida com sucesso.");
      } else {
        return reply("❌ Mensagem não encontrada.");
      }
    }
  },
};
