import path from 'path';

export default {
    name: "rpg_admin",
    description: "Configurações e menus do sistema RPG",
    commands: ["modorpg", "rpgmode", "rpg"],
    handle: async ({  
        reply, 
        isGroup, 
        isGroupAdmin, 
        groupData, 
        groupFile, 
        optimizer, 
        from, 
        command,
        nazu 
    , MESSAGES }) => {
        const sub = command.toLowerCase();

        if (sub === 'modorpg' || sub === 'rpgmode') {
            if (!isGroup) return reply(`💔 Este comando só funciona em grupos.`);
            if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
            
            groupData.modorpg = !groupData.modorpg;
            await optimizer.saveJsonWithCache(groupFile, groupData);
            
            return reply(`⚔️ Modo RPG ${groupData.modorpg ? 'ATIVADO' : 'DESATIVADO'} neste grupo.\n\n${groupData.modorpg ? '🎮 Agora os membros podem usar todos os comandos RPG!' : '🔒 Comandos RPG desativados.'}`);
        }

        if (sub === 'rpg') {
            return reply(`📖 Use o comando *${prefix}menurpg* para ver todos os comandos de RPG!`);
        }
    }
};
