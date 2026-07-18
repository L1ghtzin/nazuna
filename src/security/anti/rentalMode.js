export async function handleRentalMode(context) {
    const { isGroup, isRentalModeActive, getGroupRentalStatus, from, isCmd, isOwnerOrSub, command, reply, MESSAGES } = context;
    if (!isGroup || !isRentalModeActive || !isRentalModeActive()) return false;

    const rentalStatus = getGroupRentalStatus(from);
    const groupHasActiveRental = rentalStatus.active;
    const allowedCommandsBypass = ['modoaluguel', 'addaluguel', 'gerarcodigo', 'gerarcod', 'gerarcodigobr', 'geraraluguel', 'addsubdono', 'remsubdono', 'listasubdonos'];
    
    if (!groupHasActiveRental && isCmd && !isOwnerOrSub && !allowedCommandsBypass.includes(command)) {
        await reply(MESSAGES.security.rentalExpired);
        return true;
    }
    return false;
}

export async function handleActivationCode(context) {
    const { isGroup, isCmd, body, validateActivationCode, useActivationCode, from, sender, reply } = context;
    if (!isGroup || isCmd || !body) return false;

    const upperBody = body.toUpperCase();
    const matchPattern = upperBody.match(/\b[A-F0-9]{8}\b/);
    if (!matchPattern) return false;

    const potentialCode = matchPattern[0];
    const validation = validateActivationCode ? validateActivationCode(potentialCode) : { valid: false };
    
    if (validation.valid) {
        try {
            const activationResult = useActivationCode(potentialCode, from, sender);
            await reply(activationResult.message);
            if (activationResult.success) return true;
        } catch (e) {
            console.error(`Erro ao tentar usar código de ativação ${potentialCode} no grupo ${from}:`, e);
        }
    }
    return false;
}
