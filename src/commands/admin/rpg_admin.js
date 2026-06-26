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
        MESSAGES 
    }) => {
        const sub = command.toLowerCase();

        if (sub === 'modorpg' || sub === 'rpgmode') {
            const newState = !groupData.modorpg;
            groupData.modorpg = newState;
            
            await optimizer.saveJsonWithCache(groupFile, groupData);
            if (typeof optimizer.invalidateGroup === 'function') {
                optimizer.invalidateGroup(from);
            }
            
            return reply(MESSAGES.rpg.core.admin.toggle(newState));
        }

        if (sub === 'rpg') {
            return reply(MESSAGES.rpg.core.admin.menu(prefix));
        }

        if (sub === 'denuncias' || sub === 'reports') {
            const { reputation } = await import('../../funcs/exports.js').then(m => m.default || m);
            if (!reputation) return reply(MESSAGES.rpg.reputation.unavailable);
            return reply(reputation.getReports(from));
        }
    }
};
