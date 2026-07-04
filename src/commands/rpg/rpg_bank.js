import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    applyShopBonuses,
    fmt,
    parseAmount
} from "../../utils/database.js";

export default {
    name: "rpg_bank",
    description: "Sistema bancário RPG (Carteira, Depósito, Saque, Transferência)",
    commands: ["carteira", "banco", "depositar", "dep", "sacar", "saque", "transferir", "pix"],
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, q, args, menc_jid2, MESSAGES
    }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const { bankCapacity } = applyShopBonuses(me, econ);
        const sub = command.toLowerCase();

        if (sub === 'carteira') return reply(MESSAGES.rpg.core.wallet(fmt(me.wallet)));
        if (sub === 'banco') return reply(MESSAGES.rpg.core.bank(fmt(me.bank), fmt(bankCapacity)));

        if (sub === 'depositar' || sub === 'dep') {
            const amount = parseAmount(args[0], me.wallet);
            if (!amount || amount <= 0) return reply(MESSAGES.rpg.core.deposit.invalidAmount);
            if (amount > me.wallet) return reply(MESSAGES.rpg.core.deposit.insufficientFunds);
            const space = bankCapacity - me.bank;
            const toDep = Math.min(amount, space);
            if (toDep <= 0) return reply(MESSAGES.rpg.core.deposit.bankFull);
            me.wallet -= toDep; me.bank += toDep;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.deposit.success(fmt(toDep), fmt(me.bank)));
        }

        if (sub === 'sacar' || sub === 'saque') {
            const amount = parseAmount(args[0], me.bank);
            if (!amount || amount <= 0) return reply(MESSAGES.rpg.core.withdraw.invalidAmount);
            if (amount > me.bank) return reply(MESSAGES.rpg.core.withdraw.insufficientFunds);
            const taxa = Math.floor(amount * 0.05);
            me.bank -= amount; me.wallet += (amount - taxa);
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.withdraw.success(fmt(amount), fmt(taxa), fmt(amount - taxa)));
        }

        if (sub === 'transferir' || sub === 'pix') {
            const mentioned = menc_jid2?.[0];
            if (!mentioned) return reply(MESSAGES.rpg.core.transfer.usage(prefix, sub));
            if (mentioned === sender) return reply(MESSAGES.rpg.core.transfer.selfError);
            const rawArgs = q ? q.trim().split(/\s+/) : [];
            const numericArg = rawArgs.find(a => !a.startsWith('@') && (/^\d+/.test(a) || a === 'tudo' || a === 'all' || a === 'metade' || a === 'half'));
            const amount = parseAmount(numericArg, me.wallet);
            if (!isFinite(amount) || amount <= 0) return reply(MESSAGES.rpg.core.transfer.invalidAmount);
            const taxa = Math.floor(amount * 0.15);
            const totalNeeded = amount + taxa;
            if (totalNeeded > me.wallet) return reply(MESSAGES.rpg.core.transfer.insufficientFunds(fmt(amount), fmt(taxa), fmt(totalNeeded), fmt(me.wallet)));
            const other = getEcoUser(econ, mentioned);
            me.wallet -= totalNeeded;
            other.wallet += amount;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.transfer.success(fmt(amount), fmt(taxa), fmt(totalNeeded), mentioned.split('@')[0]), { mentions: [mentioned] });
        }
    }
};
