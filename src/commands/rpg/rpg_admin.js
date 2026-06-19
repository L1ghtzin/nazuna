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
        bot,
        prefix,
        MESSAGES 
    }) => {
        const sub = command.toLowerCase();

        if (sub === 'modorpg' || sub === 'rpgmode') {
            if (!isGroup) return reply(MESSAGES.rpg.admin.groupOnly);
            if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
            
            groupData.modorpg = !groupData.modorpg;
            await optimizer.saveJsonWithCache(groupFile, groupData);
            
            return reply(MESSAGES.rpg.admin.toggle(groupData.modorpg));
        }

        if (sub === 'rpg') {
            return reply(MESSAGES.rpg.admin.menu(prefix));
        }
    }
};
