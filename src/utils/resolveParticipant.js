import { lidCache } from './lidCache.js';

const failedCache = new Map();
const FAIL_CACHE_TTL = 30 * 1000; // 30 segundos de cache para falhas de rede

export async function resolveParticipant(identifier, ChainySock, groupMetadata = null) {
    if (!identifier) {
        return { jid: '', number: '', lid: null, isLid: false, resolved: false };
    }

    const isLid = identifier.endsWith('@lid');
    
    // 1. Verificar cache persistente carregado
    await lidCache.load();
    const cachedVal = lidCache.get(identifier);
    if (cachedVal) {
        const jid = isLid ? cachedVal : identifier;
        const lid = isLid ? identifier : cachedVal;
        const number = jid.replace(/@.*/, '');
        return { jid, number, lid, isLid, resolved: true };
    }

    // 2. Verificar cache de falhas (throttling de rede)
    if (failedCache.has(identifier)) {
        if (Date.now() - failedCache.get(identifier) < FAIL_CACHE_TTL) {
            const stripped = identifier.replace(/@.*/, '');
            return {
                jid: isLid ? '' : identifier,
                number: stripped,
                lid: isLid ? identifier : null,
                isLid,
                resolved: false
            };
        }
        failedCache.delete(identifier);
    }

    const stripped = identifier.replace(/@.*/, '');
    let number = stripped;
    let lid = isLid ? identifier : null;
    let jid = isLid ? '' : identifier;
    let resolved = false;

    // 3. Tentar via metadata do grupo (sem requisição de rede)
    if (groupMetadata?.participants) {
        const p = groupMetadata.participants.find(p => p.id === identifier || p.lid === identifier);
        if (p) {
            if (p.id?.endsWith('@s.whatsapp.net')) {
                jid = p.id;
                number = p.id.replace(/@.*/, '');
            }
            if (p.lid) {
                lid = p.lid;
            }
            if (jid && lid) {
                resolved = true;
            }
        }
    }

    // 4. Fallback: resolver via onWhatsApp
    if (!resolved && ChainySock) {
        try {
            const results = await Promise.race([
                ChainySock.onWhatsApp(identifier),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout onWhatsApp')), 3000))
            ]);
            if (results?.[0]) {
                if (results[0].jid) {
                    jid = results[0].jid;
                    number = results[0].jid.replace(/@.*/, '');
                }
                if (results[0].lid) {
                    lid = results[0].lid;
                }
                resolved = !!(jid && lid);
            }
        } catch { }
    }

    const finalResolved = resolved || (!isLid && !!jid) || (isLid && !!jid);
    const result = { jid, number, lid, isLid, resolved: finalResolved };

    // Gravar no cache persistente se resolvido com sucesso
    if (finalResolved && jid && lid) {
        lidCache.set(jid, lid);
    } else {
        // Gravar no cache de falhas temporário
        failedCache.set(identifier, Date.now());
    }

    return result;
}

export async function resolveNumber(identifier, ChainySock) {
    const { number, isLid, resolved } = await resolveParticipant(identifier, ChainySock);
    return { number, isLid, resolved };
}
