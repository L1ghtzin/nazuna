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
    normalizeParam,
    updateQuestProgress,
    checkEcoLevelUp
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

        if (sub === 'carteira') return reply(`╭━━━⊱ 💰 *CARTEIRA* 💰 ⊱━━━╮\n│\n│ 💵 Saldo: ${fmt(me.wallet)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
        if (sub === 'banco') return reply(`╭━━━⊱ 🏦 *BANCO* 🏦 ⊱━━━╮\n│\n│ 💳 Saldo: ${fmt(me.bank)}\n│ 📊 Limite: ${fmt(bankCapacity)}\n│\n╰━━━━━━━━━━━━━━━━━━━━╯`);

        if (sub === 'depositar' || sub === 'dep') {
            const amount = parseAmount(args[0], me.wallet);
            if (!amount || amount <= 0) return reply(`💔 Informe um valor.`);
            if (amount > me.wallet) return reply(`💔 Você não tem tudo isso na carteira.`);
            const space = bankCapacity - me.bank;
            const toDep = Math.min(amount, space);
            if (toDep <= 0) return reply(`╭━━━⊱ ⚠️ *BANCO CHEIO* ⚠️ ⊱━━━╮\n│\n│ Seu limite bancário foi atingido.\n│ Compre mais espaço ou melhore\n│ sua conta!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
            me.wallet -= toDep; me.bank += toDep;
            saveEconomy(econ);
            return reply(`╭━━━⊱ 🏦 *DEPÓSITO* 🏦 ⊱━━━╮\n│\n│ ✅ Sucesso!\n│\n│ 💵 Valor: ${fmt(toDep)}\n│ 💰 Saldo no banco: ${fmt(me.bank)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
        }

        if (sub === 'sacar' || sub === 'saque') {
            const amount = parseAmount(args[0], me.bank);
            if (!amount || amount <= 0) return reply(`💔 Informe um valor.`);
            if (amount > me.bank) return reply(`💔 Saldo insuficiente no banco.`);
            const taxa = Math.floor(amount * 0.05);
            me.bank -= amount; me.wallet += (amount - taxa);
            saveEconomy(econ);
            return reply(`╭━━━⊱ 🏧 *SAQUE* 🏧 ⊱━━━╮\n│\n│ ✅ Sucesso!\n│\n│ 💵 Valor sacado: ${fmt(amount)}\n│ 📉 Taxa (5%): ${fmt(taxa)}\n│ 💰 Recebido: ${fmt(amount - taxa)}\n│\n╰━━━━━━━━━━━━━━━━━━━╯`);
        }

        if (sub === 'transferir' || sub === 'pix') {
            const mentioned = menc_jid2?.[0];
            if (!mentioned) return reply(`╭━━━⊱ 💸 *TRANSFERÊNCIA* 💸 ⊱━━━╮\n│\n│ 👥 Marque um usuário e informe\n│    o valor a transferir\n│\n│ ⚠️ *Taxa de transferência: 15%*\n│\n│ 📝 *Exemplo:*\n│ ${prefix}${sub} @user 100\n│ ${prefix}${sub} 100 @user\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
            if (mentioned === sender) return reply('❌ Você não pode transferir para si mesmo.');
            // Busca o valor numérico entre os args, ignorando a menção
            const rawArgs = q ? q.trim().split(/\s+/) : [];
            const numericArg = rawArgs.find(a => !a.startsWith('@') && (/^\d+/.test(a) || a === 'tudo' || a === 'all' || a === 'metade' || a === 'half'));
            const amount = parseAmount(numericArg, me.wallet);
            if (!isFinite(amount) || amount <= 0) return reply('❌ Informe um valor válido.');
            // TAXA DE TRANSFERÊNCIA: 15%
            const taxa = Math.floor(amount * 0.15);
            const totalNeeded = amount + taxa;
            if (totalNeeded > me.wallet) return reply(`❌ Você não tem saldo suficiente.\n💰 Valor: ${fmt(amount)}\n💸 Taxa (15%): ${fmt(taxa)}\n📊 Total necessário: ${fmt(totalNeeded)}\n💼 Seu saldo: ${fmt(me.wallet)}`);
            const other = getEcoUser(econ, mentioned);
            me.wallet -= totalNeeded;
            other.wallet += amount;
            saveEconomy(econ);
            return reply(`╭━━━⊱ ✅ *TRANSFERÊNCIA* ✅ ⊱━━━╮\n│\n│ 💸 Transferido: ${fmt(amount)}\n│ 💰 Taxa (15%): ${fmt(taxa)}\n│ 📊 Total debitado: ${fmt(totalNeeded)}\n│ 👤 Para: @${mentioned.split('@')[0]}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [mentioned] });
        }

        if (sub === 'minerar' || sub === 'mine') {
            const pk = me.tools?.pickaxe;
            if (!pk || pk.dur <= 0) return reply(`╭━━━⊱ 💔 *ERRO* 💔 ⊱━━━╮\n│\n│ ⚠️ Você não tem uma picareta\n│ ou ela quebrou!\n│\n│ 💡 Compre uma na loja.\n│\n╰━━━━━━━━━━━━━━━━━━╯`);
            const cd = me.cooldowns?.mine || 0;
            if (Date.now() < cd) return reply(`╭━━━⊱ ⏳ *COOLDOWN* ⏳ ⊱━━━╮\n│\n│ ⚠️ Você está cansado!\n│ ⏰ Aguarde: ${timeLeft(cd)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
            
            const base = 150 + Math.floor(Math.random() * 201);
            const skillB = getSkillBonus(me, 'mining');
            const total = Math.floor(base * (1 + (mineBonus || 0) + skillB));
            me.wallet += total; me.cooldowns.mine = Date.now() + 15 * 60 * 1000; pk.dur--;
            me.exp = (me.exp || 0) + 30;
            addSkillXP(me, 'mining', 1);
            updateQuestProgress(me, 'gather', 1);
            const levelUpRes = checkEcoLevelUp(me);
            saveEconomy(econ);
            let msg = `╭━━━⊱ ⛏️ *MINERAÇÃO* ⛏️ ⊱━━━╮\n│\n│ ✅ Minerado com sucesso!\n│\n│ 💎 Minérios: ${fmt(total)}\n│ 🛠️ Picareta: ${pk.dur}/${pk.max}\n│ ✨ +30 XP\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
            if (levelUpRes.leveledUp) msg += `\n\n🌟 *LEVEL UP!* Você agora é nível ${levelUpRes.newLevel}!`;
            return reply(msg);
        }

        if (sub === 'trabalhar' || sub === 'work') {
            const cd = me.cooldowns?.work || 0;
            if (Date.now() < cd) return reply(`╭━━━⊱ ⏳ *COOLDOWN* ⏳ ⊱━━━╮\n│\n│ ⚠️ Você está de folga!\n│ ⏰ Retorne em: ${timeLeft(cd)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
            const job = econ.jobCatalog?.[me.job] || { min: 50, max: 100 };
            const gain = job.min + Math.floor(Math.random() * (job.max - job.min + 1));
            const bonus = Math.floor(gain * (workBonus || 0));
            me.wallet += (gain + bonus);
            me.exp = (me.exp || 0) + 20;
            me.cooldowns.work = Date.now() + 20 * 60 * 1000;
            const levelUpRes = checkEcoLevelUp(me);
            saveEconomy(econ);
            let msg = `╭━━━⊱ 💼 *TRABALHO* 💼 ⊱━━━╮\n│\n│ ✅ Turno finalizado!\n│\n│ 💰 Salário: ${fmt(gain)}\n│ 📈 Bônus: ${fmt(bonus)}\n│ 💵 Total: ${fmt(gain + bonus)}\n│ ✨ +20 XP\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
            if (levelUpRes.leveledUp) msg += `\n\n🌟 *LEVEL UP!* Você agora é nível ${levelUpRes.newLevel}!`;
            return reply(msg);
        }

        if (sub === 'loja' || sub === 'lojarps') {
            let text = '╭━━━⊱ 🛒 *LOJA RPG* 🛒 ⊱━━━╮\n│\n';
            for (const [k, it] of Object.entries(econ.shop || {})) {
                text += `│ 🔹 *${k}*\n│   ${it.name}\n│   💰 ${fmt(it.price)}\n│\n`;
            }
            text += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 Use: ${prefix}comprar <item>`;
            return reply(text);
        }

        if (sub === 'comprar' || sub === 'buy') {
            const key = (args[0] || '').toLowerCase();
            const it = econ.shop?.[key];
            if (!it) return reply(MESSAGES.rpg.invalidItem);
            if (me.wallet < it.price) return reply(MESSAGES.rpg.insufficientCoins(it.price));
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
            let text = '╭━━━⊱ 🎒 *INVENTÁRIO* 🎒 ⊱━━━╮\n│\n';
            let count = 0;
            for (const [k, q] of Object.entries(me.inventory || {})) {
                if (q > 0) {
                    text += `│ 🔹 *${k}*: ${q}\n`;
                    count++;
                }
            }
            if (count === 0) text += '│ 📭 Inventário vazio\n';
            text += `│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
            return reply(text);
        }

        if (sub === 'vagas') {
            let jobs = econ.jobCatalog || {};
            if (!jobs || Object.keys(jobs).length === 0) {
              jobs = {
                "estagiario": { name: "Estagiário", min: 80, max: 140 },
                "designer": { name: "Designer", min: 150, max: 250 },
                "programador": { name: "Programador", min: 200, max: 350 },
                "gerente": { name: "Gerente", min: 260, max: 420 }
              };
            }

            let txt = '╭━━━⊱ 💼 *VAGAS DE EMPREGO* 💼 ⊱━━━╮\n│\n';
            Object.entries(jobs).forEach(([k, j]) => {
              txt += `│ 🔹 *${k}*\n│   ${j.name}\n│   💰 ${fmt(j.min)}-${fmt(j.max)}\n│\n`;
            });
            txt += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 Use: ${prefix}emprego <vaga>`;
            return reply(txt);
        }

        if (sub === 'emprego') {
            const rawKey = (args[0] || '');
            if (!rawKey) return reply(`╭━━━⊱ 💼 *EMPREGO* 💼 ⊱━━━╮\n│\n│ ❌ Informe a vaga desejada\n│\n│ 📋 Ver vagas: ${prefix}vagas\n│\n│ 💡 Exemplo:\n│ ${prefix}emprego vendedor\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);

            const defaultJobs = {
              "estagiario": { name: "Estagiário", min: 80, max: 140 },
              "designer": { name: "Designer", min: 150, max: 250 },
              "programador": { name: "Programador", min: 200, max: 350 },
              "gerente": { name: "Gerente", min: 260, max: 420 }
            };

            const jobCatalog = (econ.jobCatalog && Object.keys(econ.jobCatalog).length) ? econ.jobCatalog : defaultJobs;
            const key = findKeyIgnoringAccents(jobCatalog, rawKey) || normalizeParam(rawKey);
            const job = jobCatalog[key];
            if (!job) return reply('❌ Vaga inexistente. Use ' + prefix + 'vagas para ver disponíveis.');

            if (!econ.jobCatalog || Object.keys(econ.jobCatalog).length === 0) {
              econ.jobCatalog = jobCatalog;
            }

            me.job = key;
            saveEconomy(econ);
            return reply(`╭━━━⊱ ✅ *CONTRATADO!* ✅ ⊱━━━╮\n│\n│ 💼 Emprego: ${job.name}\n│ 💰 Ganhos: ${fmt(job.min)}-${fmt(job.max)}\n│\n│ 🏢 Use ${prefix}trabalhar\n│    para receber seu salário!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
        }

        if (sub === 'demitir') {
            me.job = null;
            saveEconomy(econ);
            return reply(`╭━━━⊱ 👋 *DEMISSÃO* 👋 ⊱━━━╮\n│\n│ ✅ Você pediu demissão\n│\n│ 💼 Veja novas vagas: ${prefix}vagas\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
        }

        if (sub === 'pescar' || sub === 'fish') {
            const cd = me.cooldowns?.fish || 0;
            if (Date.now() < cd) return reply(`╭━━━⊱ ⏳ *COOLDOWN* ⏳ ⊱━━━╮\n│\n│ ⚠️ Sem peixes por perto!\n│ ⏰ Aguarde: ${timeLeft(cd)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
            const base = 80 + Math.floor(Math.random() * 121);
            const skillB = getSkillBonus(me, 'fishing');
            const bonus = Math.floor(base * ((fishBonus || 0) + skillB));
            const total = base + bonus;
            me.wallet += total;
            me.exp = (me.exp || 0) + 25;
            me.cooldowns.fish = Date.now() + 12 * 60 * 1000;
            addSkillXP(me, 'fishing', 1);
            updateChallenge(me, 'fish', 1, true);
            updatePeriodChallenge(me, 'fish', 1, true);
            updateQuestProgress(me, 'gather', 1);
            const levelUpRes = checkEcoLevelUp(me);
            saveEconomy(econ);
            let msg = `╭━━━⊱ 🎣 *PESCARIA* 🎣 ⊱━━━╮\n│\n│ ✅ Peixe fisgado!\n│\n│ 🐟 Lucro: ${fmt(total)}\n│ ✨ +25 XP\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
            if (levelUpRes.leveledUp) msg += `\n\n🌟 *LEVEL UP!* Você agora é nível ${levelUpRes.newLevel}!`;
            return reply(msg);
        }

        if (sub === 'explorar' || sub === 'explore') {
            const cd = me.cooldowns?.explore || 0;
            if (Date.now() < cd) return reply(`╭━━━⊱ ⏳ *COOLDOWN* ⏳ ⊱━━━╮\n│\n│ ⚠️ Você está exausto!\n│ ⏰ Aguarde: ${timeLeft(cd)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
            const base = 100 + Math.floor(Math.random() * 151);
            const skillB = getSkillBonus(me, 'exploring');
            const bonus = Math.floor(base * ((exploreBonus || 0) + skillB));
            const total = base + bonus;
            me.wallet += total;
            me.exp = (me.exp || 0) + 35;
            me.cooldowns.explore = Date.now() + 15 * 60 * 1000;
            addSkillXP(me, 'exploring', 1);
            updateChallenge(me, 'explore', 1, true);
            updatePeriodChallenge(me, 'explore', 1, true);
            updateQuestProgress(me, 'gather', 1);
            const levelUpRes = checkEcoLevelUp(me);
            saveEconomy(econ);
            let msg = `╭━━━⊱ 🧭 *EXPLORAÇÃO* 🧭 ⊱━━━╮\n│\n│ ✅ Expedição concluída!\n│\n│ 🗺️ Tesouros: ${fmt(total)}\n│ ✨ +35 XP\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
            if (levelUpRes.leveledUp) msg += `\n\n🌟 *LEVEL UP!* Você agora é nível ${levelUpRes.newLevel}!`;
            return reply(msg);
        }

        if (sub === 'cacar' || sub === 'caçar' || sub === 'hunt') {
            const cd = me.cooldowns?.hunt || 0;
            if (Date.now() < cd) return reply(`╭━━━⊱ ⏳ *COOLDOWN* ⏳ ⊱━━━╮\n│\n│ ⚠️ A floresta está vazia!\n│ ⏰ Aguarde: ${timeLeft(cd)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
            const base = 120 + Math.floor(Math.random() * 181);
            const skillB = getSkillBonus(me, 'hunting');
            const bonus = Math.floor(base * ((huntBonus || 0) + skillB));
            const total = base + bonus;
            me.wallet += total;
            me.exp = (me.exp || 0) + 40;
            me.cooldowns.hunt = Date.now() + 18 * 60 * 1000;
            addSkillXP(me, 'hunting', 1);
            updateChallenge(me, 'hunt', 1, true);
            updatePeriodChallenge(me, 'hunt', 1, true);
            updateQuestProgress(me, 'gather', 1);
            const levelUpRes = checkEcoLevelUp(me);
            saveEconomy(econ);
            let msg = `╭━━━⊱ 🏹 *CAÇADA* 🏹 ⊱━━━╮\n│\n│ ✅ Abate bem-sucedido!\n│\n│ 🍖 Loot obtido: ${fmt(total)}\n│ ✨ +40 XP\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
            if (levelUpRes.leveledUp) msg += `\n\n🌟 *LEVEL UP!* Você agora é nível ${levelUpRes.newLevel}!`;
            return reply(msg);
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
