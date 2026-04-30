import path from 'path';

export default {
    name: "rpg_admin",
    description: "Configurações e menus do sistema RPG",
    commands: ["modorpg", "rpgmode", "menurpg", "rpg"],
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

        if (sub === 'menurpg' || sub === 'rpg') {
            // No original, ele chama sendMenuWithMedia('menurpg', menuRPG)
            // Mas aqui no modular, temos acesso ao nazu e aos menus.
            // O dynamicCommand loader injeta 'menus' e 'nazu'.
            // Vamos ver se 'menus' tem o menurpg.
            
            // Note: O dynamicCommand.js injeta 'menus' que contém todos os menus carregados.
            // Mas o index.js original chama sendMenuWithMedia.
            // Vamos tentar carregar o menu de dados/src/menus/menurpg.js
            
            try {
                const { default: menuRPG } = await import('../../../menus/menurpg.js');
                // sendMenuWithMedia é uma função definida no index.js original.
                // Aqui podemos tentar replicar o comportamento ou usar o nazu.sendMessage.
                
                // No novo index.js, o sendMenuWithMedia não está sendo injetado.
                // Mas o execDynamicCommand tem acesso ao nazu.
                
                // No entanto, o usuário já tem um sistema de menus pronto.
                // Vamos apenas dar um reply simples ou tentar carregar o menu se possível.
                // O menurpg.js exporta uma função ou objeto?
                
                if (typeof menuRPG === 'function') {
                    const text = menuRPG({ prefix: groupData.prefix || '/' });
                    return reply(text);
                } else if (typeof menuRPG === 'string') {
                    return reply(menuRPG);
                } else {
                    return reply('📖 Use o comando help para ver os comandos de RPG.');
                }
            } catch (e) {
                console.error('Erro ao carregar menu RPG:', e);
                return reply(MESSAGES.error.general);
            }
        }
    }
};
