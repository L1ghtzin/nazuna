import { PREFIX } from "../../config.js";
import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    ensureUserChallenge, 
    applyShopBonuses, 
    loadLevelingSafe, 
    getUserName, 
    fmt, 
    parseAmount, 
    timeLeft, 
    getActivePickaxe, 
    ensureUserSkills, 
    SKILL_LIST,
    getSkillBonus,
    addSkillXP,
    updateChallenge,
    updatePeriodChallenge,
    isChallengeCompleted,
    findKeyIgnoringAccents,
    normalizeParam
} from "../../utils/database.js";

export default {
    name: "rpg_core",
    description: "Sistema central de RPG (Economia, Trabalhos, Banco)",
    commands: [
        "perfilrpg", "carteira", "banco", "depositar", "dep", "sacar", "saque", "transferir", "pix", "loja", "lojarps", "comprar", "buy", "inventario", "inv", "minerar", "mine", "trabalhar", "work", "vagas", "emprego", "demitir", "pescar", "fish", "explorar", "explore", "cacar", "caçar", "hunt", "resetrpg"
    ],
    handle: async ({ 
    reply, 
        isGroup, 
        groupData, 
        sender, 
        prefix, 
        command, 
        q, 
        args, 
        menc_jid2, 
        pushname, 
        AllgroupMembers, 
        isOwner, 
        isSubOwner, 
        nmrdn, 
        isBotSender,
        relationshipManager,
    MESSAGES
  }) => {
        if (!isGroup) return reply('⚔️ Os comandos RPG funcionam apenas em grupos.');
        if (!groupData.modorpg) return reply(`⚔️ *Modo RPG desativado!*\n\n🔒 Este recurso está disponível apenas quando o Modo RPG está ativado.\n🔐 *Administradores* podem ativar com: ${prefix}modorpg\n\n💡 Use ${prefix}menurpg para ver todos os comandos!`);

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const { mineBonus, workBonus, bankCapacity, fishBonus, exploreBonus, huntBonus } = applyShopBonuses(me, econ);
        const sub = command.toLowerCase();

        if (sub === 'perfilrpg') {
            const total = (me.wallet||0) + (me.bank||0);
            const level = me.level || 1;
            const exp = me.exp || 0;
            const nextLevelXp = 100 * Math.pow(1.5, level - 1);
            const expProgress = `${exp}/${Math.floor(nextLevelXp)}`;
            const expPercent = Math.min(100, Math.floor((exp / nextLevelXp) * 100));
            
            // Skills
            ensureUserSkills(me);
            const topSkills = SKILL_LIST.map(sk => ({ name: sk, level: me.skills[sk]?.level || 1 }))
              .sort((a,b) => b.level - a.level).slice(0, 3);
            
            // Estatísticas gerais
            const battlesWon = me.battlesWon || 0;
            const battlesLost = me.battlesLost || 0;
            const totalBattles = battlesWon + battlesLost;
            const winRate = totalBattles > 0 ? Math.floor((battlesWon / totalBattles) * 100) : 0;
            
            const achievements = Object.keys(me.achievements || {}).length;
            const pets = (me.pets || []).length;
            const premiumItems = Object.keys(me.premiumItems || {}).length;
            
            // Progresso de prestige
            const prestigeLevel = me.prestige?.level || 0;
            const prestigeMultiplier = me.prestige?.bonusMultiplier || 1;
            
            // Reputação
            const reputation = me.reputation?.points || 0;
            const karma = me.reputation?.karma || 0;
            
            // Streak diário
            const streak = me.streak?.count || 0;
            
            // Classe
            const classes = {
              'guerreiro': { emoji: '⚔️', name: 'Guerreiro' },
              'mago': { emoji: '🧙', name: 'Mago' },
              'arqueiro': { emoji: '🏹', name: 'Arqueiro' },
              'curandeiro': { emoji: '💚', name: 'Curandeiro' },
              'ladino': { emoji: '🗡️', name: 'Ladino' },
              'paladino': { emoji: '🛡️', name: 'Paladino' }
            };
            const classeInfo = me.classe ? `${classes[me.classe]?.emoji} ${classes[me.classe]?.name}` : 'Nenhuma';
            
            // Clã
            let clanInfo = 'Nenhum';
            if (me.clan && econ.clans && econ.clans[me.clan]) {
              const myClan = econ.clans[me.clan];
              clanInfo = myClan.name || 'Sem nome';
            }
            
            // Casa
            const casas = {
              'barraca': { emoji: '⛺', name: 'Barraca' },
              'cabana': { emoji: '🏚️', name: 'Cabana' },
              'casa': { emoji: '🏠', name: 'Casa' },
              'mansao': { emoji: '🏰', name: 'Mansão' },
              'castelo': { emoji: '🏯', name: 'Castelo' }
            };
            const houseInfo = me.house?.type ? `${casas[me.house.type]?.emoji || ''} ${casas[me.house.type]?.name || me.house.type}` : 'Nenhuma';
            
            // Família e Relacionamento
            if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
            const familyChildren = (me.family.children || []).length;
            
            // Buscar relacionamento ativo do sistema de relacionamentos
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
            
            let text = `╭━━━⊱ ⚔️ *PERFIL RPG* ⚔️ ⊱━━━╮\n`;
            text += `│ ${pushname}\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            
            text += `📊 *NÍVEL & EXPERIÊNCIA*\n`;
            text += `├ Level: ${level}\n`;
            text += `├ XP: ${expProgress} (${expPercent}%)\n`;
            text += `├ Prestige: ${prestigeLevel}x (${prestigeMultiplier.toFixed(2)}x)\n`;
            text += `└ Streak: ${streak} dia${streak !== 1 ? 's' : ''}\n\n`;
            
            text += `💰 *FINANÇAS*\n`;
            text += `├ Carteira: ${fmt(me.wallet)}\n`;
            text += `├ Banco: ${fmt(me.bank)}\n`;
            text += `├ Total: ${fmt(total)}\n`;
            text += `└ Emprego: ${me.job ? econ.jobCatalog?.[me.job]?.name || me.job : 'Desempregado(a)'}\n\n`;
            
            text += `🎭 *PERSONALIZAÇÃO*\n`;
            text += `├ Classe: ${classeInfo}\n`;
            text += `├ Clã: ${clanInfo}\n`;
            text += `└ Casa: ${houseInfo}\n\n`;
            
            text += `⚔️ *COMBATE*\n`;
            text += `├ Vitórias: ${battlesWon}\n`;
            text += `├ Derrotas: ${battlesLost}\n`;
            text += `├ Win Rate: ${winRate}%\n`;
            text += `└ Poder: ${me.power || 100}\n\n`;
            
            text += `🛠️ *HABILIDADES (TOP 3)*\n`;
            topSkills.forEach((sk, i) => {
              const prefixChar = i === topSkills.length - 1 ? '└' : '├';
              const skillName = sk.name.charAt(0).toUpperCase() + sk.name.slice(1);
              text += `${prefixChar} ${skillName}: Lv.${sk.level}\n`;
            });
            text += `\n`;
            
            text += `👨‍👩‍👧‍👦 *FAMÍLIA & RELACIONAMENTO*\n`;
            if (relationshipEmoji) {
              text += `├ ${relationshipEmoji} Status: ${relationshipType}\n`;
              text += `├ Parceiro(a): ${familySpouse}\n`;
            } else {
              text += `├ 💔 Status: Solteiro(a)\n`;
            }
            text += `└ Filhos: ${familyChildren}\n\n`;
            
            text += `🏆 *COLECIONÁVEIS*\n`;
            text += `├ Conquistas: ${achievements}\n`;
            text += `├ Pets: ${pets}\n`;
            text += `└ Itens Premium: ${premiumItems}\n\n`;
            
            text += `⭐ *REPUTAÇÃO*\n`;
            text += `├ Pontos: ${reputation}\n`;
            text += `└ Karma: ${karma}\n\n`;
            
            text += `💎 Use ${prefix}meustats para ver estatísticas detalhadas`;
            
            return reply(text, mentions.length > 0 ? { mentions } : undefined);
        }

        if (sub === 'carteira') return reply(`💰 *Sua carteira:* ${fmt(me.wallet)}`);
        if (sub === 'banco') return reply(`🏦 *Seu banco:* ${fmt(me.bank)} / ${fmt(bankCapacity)}`);

        if (sub === 'depositar' || sub === 'dep') {
            const amount = parseAmount(args[0], me.wallet);
            if (!amount || amount <= 0) return reply(`💔 Informe um valor.`);
            const space = bankCapacity - me.bank;
            const toDep = Math.min(amount, space);
            if (toDep <= 0) return reply('⚠️ Banco cheio!');
            me.wallet -= toDep; me.bank += toDep;
            saveEconomy(econ);
            return reply(`✅ Depositado ${fmt(toDep)}.`);
        }

        if (sub === 'sacar' || sub === 'saque') {
            const amount = parseAmount(args[0], me.bank);
            if (!amount || amount <= 0) return reply(`💔 Informe um valor.`);
            const taxa = Math.floor(amount * 0.05);
            me.bank -= amount; me.wallet += (amount - taxa);
            saveEconomy(econ);
            return reply(`✅ Sacado ${fmt(amount - taxa)} (Taxa: ${fmt(taxa)}).`);
        }

        if (sub === 'transferir' || sub === 'pix') {
            const mentioned = menc_jid2?.[0];
            if (!mentioned) return reply(`💔 Marque alguém.`);
            const amount = parseAmount(args.slice(-1)[0], me.wallet);
            if (!amount || amount <= 0) return reply(`💔 Informe um valor.`);
            const taxa = Math.floor(amount * 0.15);
            if (me.wallet < amount + taxa) return reply(`💔 Saldo insuficiente (incluindo taxa 15%).`);
            const other = getEcoUser(econ, mentioned);
            me.wallet -= (amount + taxa); other.wallet += amount;
            saveEconomy(econ);
            return reply(`✅ Enviado ${fmt(amount)} para @${mentioned.split('@')[0]}.`, { mentions: [mentioned] });
        }

        if (sub === 'minerar' || sub === 'mine') {
            const pk = me.tools?.pickaxe;
            if (!pk || pk.dur <= 0) return reply(`💔 Sua picareta quebrou!`);
            const cd = me.cooldowns?.mine || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)}.`);
            
            const base = 150 + Math.floor(Math.random() * 201);
            const skillB = getSkillBonus(me, 'mining');
            const total = Math.floor(base * (1 + (mineBonus || 0) + skillB));
            me.wallet += total; me.cooldowns.mine = Date.now() + 15 * 60 * 1000; pk.dur--;
            addSkillXP(me, 'mining', 1);
            saveEconomy(econ);
            return reply(`⛏️ Você minerou ${fmt(total)}! Picareta: ${pk.dur}/${pk.max}`);
        }

        if (sub === 'trabalhar' || sub === 'work') {
            const cd = me.cooldowns?.work || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)}.`);
            const job = econ.jobCatalog?.[me.job] || { min: 50, max: 100 };
            const gain = job.min + Math.floor(Math.random() * (job.max - job.min + 1));
            const bonus = Math.floor(gain * (workBonus || 0));
            me.wallet += (gain + bonus);
            me.cooldowns.work = Date.now() + 20 * 60 * 1000;
            saveEconomy(econ);
            return reply(`💼 Você trabalhou e recebeu ${fmt(gain + bonus)}!`);
        }

        if (sub === 'loja' || sub === 'lojarps') {
            let text = '🛒 *LOJA*\n\n';
            for (const [k, it] of Object.entries(econ.shop || {})) {
                text += `• ${k} — ${fmt(it.price)} (${it.name})\n`;
            }
            return reply(text);
        }

        if (sub === 'comprar' || sub === 'buy') {
            const key = (args[0] || '').toLowerCase();
            const it = econ.shop?.[key];
            if (!it) return reply(`💔 Item não encontrado.`);
            if (me.wallet < it.price) return reply('💰 Saldo insuficiente.');
            me.wallet -= it.price;
            if (it.type === 'tool') {
                me.tools = me.tools || {};
                me.tools[it.toolType] = { tier: it.tier, dur: it.durability, max: it.durability, key };
            } else {
                me.inventory[key] = (me.inventory[key] || 0) + 1;
            }
            saveEconomy(econ);
            return reply(`✅ Você comprou ${it.name}!`);
        }

        if (sub === 'inventario' || sub === 'inv') {
            let text = '🎒 *INVENTÁRIO*\n\n';
            for (const [k, q] of Object.entries(me.inventory || {})) {
                if (q > 0) text += `• ${k}: ${q}\n`;
            }
            return reply(text);
        }

        if (sub === 'resetrpg' && isOwner) {
            const target = menc_jid2?.[0];
            if (!target) return reply(`💔 Marque alguém.`);
            delete econ.users[target];
            saveEconomy(econ);
            return reply(`✅ Dados resetados para @${target.split('@')[0]}.`, { mentions: [target] });
        }
    }
};
