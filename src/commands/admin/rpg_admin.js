import path from 'path';

export default {
    name: "rpg_admin",
    description: "Configurações e menus do sistema RPG",
    commands: ["modorpg", "rpgmode", "rpg", "denuncias", "reports"],
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
        MESSAGES,
        reputation
    }) => {
        const sub = command.toLowerCase();

        if (sub === 'modorpg' || sub === 'rpgmode') {
            const newState = !groupData.modorpg;
            groupData.modorpg = newState;
            
            await optimizer.saveJsonWithCache(groupFile, groupData);
            if (typeof optimizer.invalidateGroup === 'function') {
                optimizer.invalidateGroup(from);
            }
            
            return reply(MESSAGES.rpg.admin.toggle(newState));
        }

        if (sub === 'rpg') {
            return reply(MESSAGES.rpg.admin.menu(prefix));
        }

        if (sub === 'denuncias' || sub === 'reports') {
            if (!reputation) return reply(MESSAGES.rpg.reputation.unavailable);
            return reply(reputation.getReports(from));
        }
    }
};
