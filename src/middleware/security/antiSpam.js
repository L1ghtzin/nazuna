let _antispamWriteTimer = null;
let _antispamPendingData = null;
let _antispamPendingPath = null;

function debouncedAntiSpamWrite(filePath, data, writeJsonFile) {
    _antispamPendingData = data;
    _antispamPendingPath = filePath;
    if (!_antispamWriteTimer) {
        _antispamWriteTimer = setTimeout(() => {
            if (_antispamPendingData && _antispamPendingPath && writeJsonFile) {
                writeJsonFile(_antispamPendingPath, _antispamPendingData);
            }
            _antispamWriteTimer = null;
            _antispamPendingData = null;
            _antispamPendingPath = null;
        }, 5000); // Escreve no máximo a cada 5 segundos
    }
}

export async function handleAntiSpam(context) {
    const { isCmd, antiSpamGlobal, isOwnerOrSub, sender, reply, writeJsonFile, DATABASE_DIR, MESSAGES } = context;
    if (!isCmd || !antiSpamGlobal?.enabled || isOwnerOrSub) return false;

    try {
        const cfg = antiSpamGlobal;
        cfg.users = cfg.users || {};
        cfg.blocks = cfg.blocks || {};
        const now = Date.now();
        const blockInfo = cfg.blocks[sender];
        
        if (blockInfo && blockInfo.until && now < blockInfo.until) {
            const msLeft = blockInfo.until - now;
            const secs = Math.ceil(msLeft / 1000);
            const m = Math.floor(secs / 60), s = secs % 60;
            await reply(MESSAGES.security.antiSpamWarn(m > 0 ? `${m}m ${s}s` : `${secs}s`));
            return true;
        } else if (blockInfo && blockInfo.until && now >= blockInfo.until) {
            delete cfg.blocks[sender];
        }
        
        const intervalMs = (cfg.interval || 10) * 1000;
        const limit = Math.max(1, parseInt(cfg.limit || 5));
        const arr = (cfg.users[sender]?.times || []).filter(ts => now - ts <= intervalMs);
        arr.push(now);
        cfg.users[sender] = { times: arr };
        
        if (arr.length > limit) {
            const blockMs = Math.max(1, parseInt(cfg.blockTime || 600)) * 1000;
            cfg.blocks[sender] = { until: now + blockMs, at: new Date().toISOString(), count: arr.length };
            if (writeJsonFile && DATABASE_DIR) writeJsonFile(DATABASE_DIR + '/antispam.json', cfg);
            await reply(MESSAGES.security.antiSpamBlocked(limit, cfg.interval, Math.floor(blockMs / 60000)));
            return true;
        }
        if (writeJsonFile && DATABASE_DIR) debouncedAntiSpamWrite(DATABASE_DIR + '/antispam.json', cfg, writeJsonFile);
    } catch (e) {
        console.error('Erro no AntiSpam Global:', e);
    }
    return false;
}
