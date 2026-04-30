import { loadLevelingSafe, getLevelingUser, checkLevelUp, saveLevelingSafe } from '../utils/database.js';

export async function processStats(context) {
    const { 
        nazu, info, isGroup, sender, groupData, isCmd, type, pushname, 
        writeJsonFile, groupFile, optimizer, from
    } = context;

    // 1. Message Counter (Group Only)
    if (isGroup) {
      try {
        groupData.contador = groupData.contador || [];
        const userIndex = groupData.contador.findIndex(user => user.id === sender);
        
        if (userIndex !== -1) {
          const userData = groupData.contador[userIndex];
          if (isCmd) {
            userData.cmd = (userData.cmd || 0) + 1;
          } else if (type === "stickerMessage") {
            userData.figu = (userData.figu || 0) + 1;
          } else {
            userData.msg = (userData.msg || 0) + 1;
          }
          
          if (pushname && userData.pushname !== pushname) {
            userData.pushname = pushname;
          }
          userData.lastActivity = new Date().toISOString();
        } else {
          groupData.contador.push({
            id: sender,
            msg: isCmd ? 0 : 1,
            cmd: isCmd ? 1 : 0,
            figu: type === "stickerMessage" ? 1 : 0,
            pushname: pushname || 'Usuário Desconhecido',
            firstSeen: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          });
        }
        
        if (writeJsonFile && groupFile) {
          writeJsonFile(groupFile, groupData);
          if (optimizer) optimizer.invalidateGroup(from);
        }
      } catch (error) {
        console.error("Erro no sistema de contagem de mensagens:", error);
      }
    }

    // 2. Leveling System
    if (isGroup && groupData.levelingEnabled) {
      try {
        const levelingData = loadLevelingSafe();
        const userData = getLevelingUser(levelingData, sender);
        
        // Atualiza contadores e XP
        userData.messages = (userData.messages || 0) + 1;
        if (isCmd) {
          userData.commands = (userData.commands || 0) + 1;
          userData.xp = (userData.xp || 0) + 10;
        } else {
          userData.xp = (userData.xp || 0) + 5;
        }
        userData.lastMessage = Date.now();
        
        // Verifica level up e salva
        checkLevelUp(sender, userData, levelingData, nazu, from);
        saveLevelingSafe(levelingData);
      } catch (levelingError) {
        console.error('❌ Erro no sistema de leveling:', levelingError.message);
      }
    }

    return { success: true };
}
