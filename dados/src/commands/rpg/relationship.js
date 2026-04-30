import { PREFIX } from "../../config.js";

export default {
  name: "relationship",
  description: "Sistema de relacionamentos (namoro, casamento, traição)",
  commands: ["brincadeira", "casais", "casamento", "casar", "couples", "divorciar", "divorcio", "historicodetraicao", "historicotraicao", "historicotraicoes", "listacasais", "namorar", "namoro", "relacionamento", "terminar", "terminarelacionamento", "termino", "traicao", "trair"],
  usage: `${PREFIX}casar @user`,
  handle: async ({ 
    nazu, 
    from, 
    info, 
    command,
    reply, 
    isGroup, 
    sender, 
    prefix, 
    menc_os2, 
    menc_jid2, 
    groupData, 
    isGroupAdmin, 
    isOwner, 
    relationshipManager,
    AllgroupMembers,
    MESSAGES
  }) => {
    if (!isGroup) return reply(`💔 Este comando só pode ser usado em grupos!`);
    
    // O sistema de relacionamentos usa o 'isModoBn' (Modo Brincadeira) no index.js original
    // mas aqui estamos usando groupData.modorpg ou similar se for parte do RPG.
    // No index.js estava usando !isModoBn.
    const isModoBn = groupData.modobn || groupData.modobrincadeira || true; 
    if (!isModoBn) return reply(`💔 O modo brincadeira está desativado neste grupo.`);



    // --- PEDIDOS (Namoro, Casamento, Brincadeira) ---
    if (['namoro', 'namorar', 'casamento', 'casar', 'brincadeira'].includes(command)) {
      if (!menc_os2) return reply(`💔 Marque a pessoa que você deseja pedir em ${command}.`);
      if (menc_os2 === sender) return reply(`💔 Você não pode pedir a si mesmo em relacionamento!`);

      const type = command.includes('casar') || command === 'casamento' ? 'casamento' : 
                   command.includes('namor') ? 'namoro' : 'brincadeira';

      const requestResult = relationshipManager.createRequest(type, from, sender, menc_os2);
      if (!requestResult.success) {
        return nazu.sendMessage(from, {
          text: requestResult.message,
          mentions: requestResult.mentions || []
        }, { quoted: info });
      }

      return nazu.sendMessage(from, {
        text: requestResult.message,
        mentions: requestResult.mentions || [sender, menc_os2]
      });
    }

    // --- CONSULTAR RELACIONAMENTO ---
    if (command === 'relacionamento') {
      const mentionedList = Array.isArray(menc_jid2) ? menc_jid2 : [];
      let userOne = null, userTwo = null;

      if (mentionedList.length >= 2) {
        [userOne, userTwo] = mentionedList;
      } else if (menc_os2) {
        userOne = sender;
        userTwo = menc_os2;
      } else {
        const activePair = relationshipManager.getActivePairForUser(sender);
        if (!activePair) return reply(`💔 Você não marcou ninguém e não possui relacionamento ativo no momento.`);
        userOne = sender;
        userTwo = activePair.partnerId;
      }

      if (userOne === userTwo) return reply(`💔 Selecione pessoas diferentes para consultar.`);

      const summary = relationshipManager.getRelationshipSummary(userOne, userTwo);
      return nazu.sendMessage(from, {
        text: summary.message,
        mentions: summary.mentions || [userOne, userTwo]
      }, { quoted: info });
    }

    // --- LISTA DE CASAIS ---
    if (['casais', 'couples', 'listacasais'].includes(command)) {
      const allRelationships = relationshipManager.getAllRelationships ? relationshipManager.getAllRelationships() : [];
      const groupCouples = allRelationships.filter(rel => 
        rel.type === 'casamento' && 
        AllgroupMembers.includes(rel.user1) && 
        AllgroupMembers.includes(rel.user2)
      );
      
      if (groupCouples.length === 0) {
        return reply(`💔 Não há casais neste grupo ainda!\n\n💡 Use ${prefix}casar @pessoa para se casar!`);
      }
      
      let text = `╭━━━⊱ 💕 *CASAIS DO GRUPO* ⊱━━━╮\n│\n`;
      const mentions = [];
      groupCouples.forEach((couple, i) => {
        text += `│ ${i + 1}. @${couple.user1.split('@')[0]} 💍 @${couple.user2.split('@')[0]}\n`;
        text += `│    📅 Desde: ${couple.startDate ? new Date(couple.startDate).toLocaleDateString('pt-BR') : 'N/A'}\n│\n`;
        mentions.push(couple.user1, couple.user2);
      });
      text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n💕 Total: ${groupCouples.length} casal(is)`;
      return nazu.sendMessage(from, { text, mentions }, { quoted: info });
    }

    // --- TERMINAR / DIVORCIAR ---
    if (['divorciar', 'divorcio', 'terminar', 'termino', 'terminarelacionamento'].includes(command)) {
      const mentionedList = Array.isArray(menc_jid2) ? menc_jid2 : [];
      let userOne = null, userTwo = null;

      if (mentionedList.length >= 2) {
        [userOne, userTwo] = mentionedList;
      } else if (menc_os2) {
        userOne = sender;
        userTwo = menc_os2;
      } else {
        const activePair = relationshipManager.getActivePairForUser(sender);
        if (!activePair) return reply(`💔 Você não possui relacionamento ativo para encerrar.`);
        userOne = sender;
        userTwo = activePair.partnerId;
      }

      if (userOne === userTwo) return reply(`💔 Selecione pessoas diferentes.`);

      const participants = [userOne, userTwo];
      if (!participants.includes(sender) && !isGroupAdmin && !isOwner) {
        return reply('🚫 Apenas os envolvidos ou um administrador podem encerrar o relacionamento de terceiros.');
      }

      const endResult = relationshipManager.endRelationship(userOne, userTwo, sender);
      return nazu.sendMessage(from, {
        text: endResult.message,
        mentions: endResult.mentions || participants
      });
    }

    // --- TRAIÇÃO ---
    if (['trair', 'traicao'].includes(command)) {
      if (!menc_os2) return reply(`💔 Você precisa marcar alguém para trair! Exemplo: ${prefix}trair @pessoa`);
      if (menc_os2 === sender) return reply(`💔 Você não pode trair a si mesmo... isso não faz sentido! 🤨`);

      const betrayalResult = relationshipManager.createBetrayalRequest(sender, menc_os2, from, prefix);
      return nazu.sendMessage(from, {
        text: betrayalResult.message,
        mentions: betrayalResult.mentions || [sender, menc_os2]
      });
    }

    // --- HISTÓRICO DE TRAIÇÃO ---
    if (['historicotraicao', 'historicotraicoes', 'historicodetraicao'].includes(command)) {
      const mentionedList = Array.isArray(menc_jid2) ? menc_jid2 : [];
      let userOne = null, userTwo = null;

      if (mentionedList.length >= 2) {
        [userOne, userTwo] = mentionedList;
      } else if (menc_os2) {
        userOne = sender;
        userTwo = menc_os2;
      } else {
        const activePair = relationshipManager.getActivePairForUser(sender);
        if (!activePair) return reply(`💔 Você não possui relacionamento ativo para consultar o histórico.`);
        userOne = sender;
        userTwo = activePair.partnerId;
      }

      const historyResult = relationshipManager.getBetrayalHistory(userOne, userTwo);
      return nazu.sendMessage(from, {
        text: historyResult.message,
        mentions: historyResult.mentions || [userOne, userTwo]
      });
    }
  },
};
