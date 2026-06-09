/**
 * Utilitário centralizado para resolução de participantes (LID → JID).
 */

export async function resolveParticipant(identifier, ChainySock, groupMetadata = null) {
    if (!identifier) {
        return { jid: '', number: '', lid: null, isLid: false, resolved: false };
    }

    const stripped = identifier.replace(/@.*/, '');
    const isLid = identifier.endsWith('@lid');

    let number = stripped;
    let lid = isLid ? identifier : null;
    let jid = isLid ? '' : identifier;
    let resolved = !isLid;

    if (isLid) {
        // Tentar via metadata do grupo (sem requisição)
        if (groupMetadata?.participants) {
            const p = groupMetadata.participants.find(p => p.id === identifier || p.lid === identifier);
            if (p?.id?.endsWith('@s.whatsapp.net')) {
                jid = p.id;
                number = p.id.replace(/@.*/, '');
                resolved = true;
            }
            if (p?.lid) lid = p.lid;
        }

        // Fallback: resolver via onWhatsApp
        if (!resolved && ChainySock) {
            try {
                const results = await ChainySock.onWhatsApp(identifier);
                if (results?.[0]?.jid) {
                    jid = results[0].jid;
                    number = results[0].jid.replace(/@.*/, '');
                    resolved = true;
                }
                if (results?.[0]?.lid) lid = results[0].lid;
            } catch { }
        }
    }

    return { jid, number, lid, isLid, resolved };
}

export async function resolveNumber(identifier, ChainySock) {
    const { number, isLid, resolved } = await resolveParticipant(identifier, ChainySock);
    return { number, isLid, resolved };
}
