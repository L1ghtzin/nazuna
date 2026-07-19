import { loadLevelingSafe, getLevelingUser, checkLevelUp, saveLevelingSafe } from '../utils/database.js';
import { queue as writeQueued } from '../utils/database/io.js';
import { loadActivityData, buildActivityFilePath } from '../utils/groupManager.js';

export async function processStats(context) {
    const { 
        bot, info, isGroup, sender, groupData, isCmd, type, pushname, 
        groupFile, from
    } = context;

    // 1. Message Counter (Group Only) — persists in separate activity file
    if (isGroup) {
      try {
        const activityFile = buildActivityFilePath(from);
        const contador = await loadActivityData(from);

        // O(1) lookup por userId (formato objeto, igual ao Misa)
        const entry = contador[sender] || {
          msg:          0,
          cmd:          0,
          figu:         0,
          pushname:     pushname || null,
          firstSeen:    new Date().toISOString(),
          lastActivity: null,
        };

        if (isCmd) {
          entry.cmd = (entry.cmd || 0) + 1;
        } else if (type === "stickerMessage") {
          entry.figu = (entry.figu || 0) + 1;
        } else {
          entry.msg = (entry.msg || 0) + 1;
        }

        if (pushname && entry.pushname !== pushname) entry.pushname = pushname;
        entry.lastActivity = new Date().toISOString();

        contador[sender] = entry;
        await writeQueued(activityFile, contador);
      } catch (error) {
        console.error("Erro no sistema de contagem de mensagens:", error);
      }
    }

    // 2. Leveling System
    if (isGroup && groupData.levelingEnabled) {
      try {
        const levelingData = loadLevelingSafe();
        const userData = getLevelingUser(levelingData, sender);
        
        userData.messages = (userData.messages || 0) + 1;
        if (isCmd) {
          userData.commands = (userData.commands || 0) + 1;
          userData.xp = (userData.xp || 0) + 10;
        } else {
          userData.xp = (userData.xp || 0) + 5;
        }
        userData.lastMessage = Date.now();
        
        checkLevelUp(sender, userData, levelingData, bot, from);
        saveLevelingSafe(levelingData);
      } catch (levelingError) {
        console.error('❌ Erro no sistema de leveling:', levelingError.message);
      }
    }

    return { success: true };
}
