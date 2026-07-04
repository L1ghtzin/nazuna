import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    ensureUserSkills,
    SKILL_LIST,
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_core",
    description: "Perfil e reset do RPG",
    commands: ["perfilrpg", "resetrpg"],
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, menc_jid2, pushname, isOwner, relationshipManager, MESSAGES
    }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        if (sub === 'perfilrpg') {
            const total = (me.wallet||0) + (me.bank||0);
            const level = me.level || 1;
            const exp = me.exp || 0;
            const nextLevelXp = 100 * Math.pow(1.5, level - 1);
            const expProgress = `${exp}/${Math.floor(nextLevelXp)}`;
            const expPercent = Math.min(100, Math.floor((exp / nextLevelXp) * 100));

            ensureUserSkills(me);
            const topSkills = SKILL_LIST.map(sk => ({ name: sk, level: me.skills[sk]?.level || 1 }))
              .sort((a,b) => b.level - a.level).slice(0, 3);

            const battlesWon = me.battlesWon || 0;
            const battlesLost = me.battlesLost || 0;
            const totalBattles = battlesWon + battlesLost;
            const winRate = totalBattles > 0 ? Math.floor((battlesWon / totalBattles) * 100) : 0;

            const achievements = Object.keys(me.achievements || {}).length;
            const pets = (me.pets || []).length;
            const premiumItems = Object.keys(me.premiumItems || {}).length;

            const prestigeLevel = me.prestige?.level || 0;
            const prestigeMultiplier = me.prestige?.bonusMultiplier || 1;

            const reputation = me.reputation?.points || 0;
            const karma = me.reputation?.karma || 0;

            const streak = me.streak?.count || 0;

            const classes = {
              'guerreiro': { emoji: '⚔️', name: 'Guerreiro' },
              'mago': { emoji: '🧙', name: 'Mago' },
              'arqueiro': { emoji: '🏹', name: 'Arqueiro' },
              'curandeiro': { emoji: '💚', name: 'Curandeiro' },
              'ladino': { emoji: '🗡️', name: 'Ladino' },
              'paladino': { emoji: '🛡️', name: 'Paladino' }
            };
            const classeInfo = me.classe ? `${classes[me.classe]?.emoji} ${classes[me.classe]?.name}` : 'Nenhuma';

            let clanInfo = 'Nenhum';
            if (me.clan && econ.clans && econ.clans[me.clan]) {
              const myClan = econ.clans[me.clan];
              clanInfo = myClan.name || 'Sem nome';
            }

            const casas = {
              'barraca': { emoji: '⛺', name: 'Barraca' },
              'cabana': { emoji: '🏚️', name: 'Cabana' },
              'casa': { emoji: '🏠', name: 'Casa' },
              'mansao': { emoji: '🏰', name: 'Mansão' },
              'castelo': { emoji: '🏯', name: 'Castelo' }
            };
            const houseInfo = me.house?.type ? `${casas[me.house.type]?.emoji || ''} ${casas[me.house.type]?.name || me.house.type}` : 'Nenhuma';

            if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
            const familyChildren = (me.family.children || []).length;

            let familySpouse = 'Solteiro(a)';
            let relationshipType = '';
            let relationshipEmoji = '';
            const mentions = [];

            const activePair = relationshipManager?.getActivePairForUser ? relationshipManager.getActivePairForUser(sender) : null;
            if (activePair && activePair.partnerId) {
              familySpouse = `@${activePair.partnerId.split('@')[0]}`;
              mentions.push(activePair.partnerId);

              if (activePair.pair?.status === 'casamento') {
                relationshipType = 'Casado(a)';
                relationshipEmoji = '💍';
              } else if (activePair.pair?.status === 'namoro') {
                relationshipType = 'Namorando';
                relationshipEmoji = '💞';
              } else if (activePair.pair?.status === 'brincadeira') {
                relationshipType = 'Brincadeira';
                relationshipEmoji = '🎈';
              }
            } else if (me.family.spouse) {
                familySpouse = `@${me.family.spouse.split('@')[0]}`;
                mentions.push(me.family.spouse);
                relationshipType = 'Casado(a)';
                relationshipEmoji = '💍';
            }

            let text = MESSAGES.rpg.core.profile.header(pushname);

            text += MESSAGES.rpg.core.profile.exp(level, expProgress, expPercent, prestigeLevel, prestigeMultiplier.toFixed(2), `${streak} dia${streak !== 1 ? 's' : ''}`);

            text += MESSAGES.rpg.core.profile.finances(fmt(me.wallet), fmt(me.bank), fmt(total), me.job ? econ.jobCatalog?.[me.job]?.name || me.job : 'Desempregado(a)');

            text += MESSAGES.rpg.core.profile.custom(classeInfo, clanInfo, houseInfo);

            text += MESSAGES.rpg.core.profile.combat(battlesWon, battlesLost, winRate, me.power || 100);

            text += MESSAGES.rpg.core.profile.skillsHeader;
            topSkills.forEach((sk, i) => {
              const prefixChar = i === topSkills.length - 1 ? '└' : '├';
              const skillName = sk.name.charAt(0).toUpperCase() + sk.name.slice(1);
              text += `${prefixChar} ${skillName}: Lv.${sk.level}\n`;
            });
            text += `\n`;

            text += MESSAGES.rpg.core.profile.familyHeader;
            if (relationshipEmoji) {
              text += MESSAGES.rpg.core.profile.familyStatus(relationshipEmoji, relationshipType, familySpouse);
            } else {
              text += MESSAGES.rpg.core.profile.familySingle;
            }
            text += MESSAGES.rpg.core.profile.familyChildren(familyChildren);

            text += MESSAGES.rpg.core.profile.collectibles(achievements, pets, premiumItems);

            text += MESSAGES.rpg.core.profile.reputation(reputation, karma);

            text += MESSAGES.rpg.core.profile.footer(prefix);

            return reply(text, mentions.length > 0 ? { mentions } : undefined);
        }

        if (sub === 'resetrpg' && isOwner) {
            const target = menc_jid2?.[0];
            if (!target) return reply(MESSAGES.rpg.core.reset.needMention);
            delete econ.users[target];
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.reset.success(target.split('@')[0]), { mentions: [target] });
        }
    }
};
