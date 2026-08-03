import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// createRequire is only used for JSON or true CJS modules
const require = createRequire(import.meta.url);



/**
 * Inicializa e retorna o objeto de módulos agregados.
 * Usa import() dinâmico para módulos ESM e mantém a mesma "shape" pública anterior.
 */
let modulesPromise;

async function loadModules() {
    if (modulesPromise) return modulesPromise;

    modulesPromise = (async () => {
        const modules = {};

        // --- downloads (ESM via dynamic import) ---
        const [
            youtubeMod,
            tiktokMod,
            pinterestMod,
            igdlMod,
            lyricsMod,
            mcpluginsMod,
            spotifyMod,
            soundcloudMod,
            facebookMod,
            kwaiMod,
        ] = await Promise.all([
            import('./downloads/youtube.js'),
            import('./downloads/tiktok.js'),
            import('./downloads/pinterest.js'),
            import('./downloads/igdl.js'),
            import('./downloads/lyrics.js'),
            import('./downloads/mcplugins.js'),
            import('./downloads/spotify.js'),
            import('./downloads/soundcloud.js'),
            import('./downloads/facebook.js'),
            import('./downloads/kwai.js'),
        ]);

        // Download modules with null checking
        modules.youtube = youtubeMod.default ?? youtubeMod;
        if (modules.youtube && typeof modules.youtube.search !== 'function') {
            console.warn('[EXPORTS] YouTube search function not found, adding fallback');
            modules.youtube.search = () => { throw new Error('YouTube search not available'); };
        }

        modules.tiktok = tiktokMod.default ?? tiktokMod;
        if (modules.tiktok && typeof modules.tiktok.dl !== 'function') {
            console.warn('[EXPORTS] TikTok dl function not found');
        }

        modules.pinterest = pinterestMod.default ?? pinterestMod;
        if (modules.pinterest && typeof modules.pinterest.dl !== 'function') {
            console.warn('[EXPORTS] Pinterest dl function not found');
        }

        modules.igdl = igdlMod.default ?? igdlMod;
        modules.Lyrics = lyricsMod.default ?? lyricsMod;
        modules.mcPlugin = mcpluginsMod.default ?? mcpluginsMod;
        modules.spotify = spotifyMod.default ?? spotifyMod;
        modules.soundcloud = soundcloudMod.default ?? soundcloudMod;
        modules.facebook = facebookMod.default ?? facebookMod;
        modules.kwai = kwaiMod.default ?? kwaiMod;
        
        if (modules.kwai && typeof modules.kwai.dl !== 'function') {
            console.warn('[EXPORTS] Kwai dl function not found');
        }
        
        // Enhanced null checking and error handling for all modules
        if (modules.youtube) {
            // Ensure critical methods exist
            const youtubeMethods = ['search', 'mp3', 'mp4'];
            youtubeMethods.forEach(method => {
                if (typeof modules.youtube[method] !== 'function') {
                    console.warn(`[EXPORTS] YouTube.${method} not available, adding fallback`);
                    modules.youtube[method] = (...args) => {
                        throw new Error(`YouTube ${method} function not available`);
                    };
                }
            });
        } else {
            console.warn('[EXPORTS] YouTube module not loaded');
        }

        // --- utils (ESM via dynamic import) ---
        const [
            Dicionário, 
            styleTextMod,
            verifyUpdateMod,
            emojiMixMod,
            uploadMod,
            tictactoeMod,
            stickerMod,
            commandStatsMod,
            relationshipsMod,
            connect4Mod,
            unoMod,
            memoriaMod,
            achievementsMod,
            giftsMod,
            reputationMod,
            qrcodeMod,
            notesMod,
            calculatorMod,
            audioEditMod,
            transmissaoMod,
            // Novos módulos de serviços
            gdriveMod,
            mediafireMod,
            twitterMod,
            searchMod,
            imagetoolsMod,
            freefireMod,
        ] = await Promise.all([
            import('./utils/dicionario.js'), 
            import('./utils/gerarnick.js'),
            import('./utils/update-verify.js'),
            import('./utils/emojimix.js'),
            import('./utils/upload.js'),
            import('./utils/tictactoe.js'),
            import('./utils/sticker.js'),
            import('./utils/commandStats.js'),
            import('./utils/relationships.js'),
            import('./utils/connect4.js'),
            import('./utils/uno.js'),
            import('./utils/memoria.js'),
            import('./utils/achievements.js'),
            import('./utils/gifts.js'),
            import('./utils/reputation.js'),
            import('./utils/qrcode.js'),
            import('./utils/notes.js'),
            import('./utils/calculator.js'),
            import('./utils/audioEdit.js'),
            import('./utils/transmissao.js'),
            // Novos módulos de serviços
            import('./utils/gdrive.js'),
            import('./utils/mediafire.js'),
            import('./utils/twitter.js'),
            import('./utils/search.js'),
            import('./utils/imagetools.js'),
            import('./utils/freefire.js'),
        ]);

        // Utils modules with null checking
        modules.Dicionary = Dicionário.default ?? Dicionário;
        modules.styleText = styleTextMod.default ?? styleTextMod;
        modules.VerifyUpdate = verifyUpdateMod.default ?? verifyUpdateMod;
        modules.emojiMix = emojiMixMod.default ?? emojiMixMod;
        modules.upload = uploadMod.default ?? uploadMod;
        modules.tictactoe = tictactoeMod.default ?? tictactoeMod;
        modules.stickerModule = stickerMod.default ?? stickerMod;
        modules.commandStats = commandStatsMod.default ?? commandStatsMod;
        modules.relationshipManager = relationshipsMod.default ?? relationshipsMod;
        
        // Novos módulos de jogos e utilidades
        modules.connect4 = connect4Mod.default ?? connect4Mod;
        modules.uno = unoMod.default ?? unoMod;
        modules.memoria = memoriaMod.default ?? memoriaMod;
        modules.achievements = achievementsMod.default ?? achievementsMod;
        modules.gifts = giftsMod.default ?? giftsMod;
        modules.reputation = reputationMod.default ?? reputationMod;
        modules.qrcode = qrcodeMod.default ?? qrcodeMod;
        modules.notes = notesMod.default ?? notesMod;
        modules.calculator = calculatorMod.default ?? calculatorMod;
        modules.audioEdit = audioEditMod.default ?? audioEditMod;
        modules.transmissao = transmissaoMod.default ?? transmissaoMod;
        
        // Novos módulos de serviços (implementações locais sem cog.api.br)
        modules.gdrive = gdriveMod.default ?? gdriveMod;
        modules.mediafire = mediafireMod.default ?? mediafireMod;
        modules.twitter = twitterMod.default ?? twitterMod;
        modules.search = searchMod.default ?? searchMod;
        modules.imagetools = imagetoolsMod.default ?? imagetoolsMod;
        modules.freefire = freefireMod.default ?? freefireMod;

        // expose sendSticker directly (preserving previous API shape) with null check
        if (modules.stickerModule && modules.stickerModule.sendSticker) {
            modules.sendSticker = modules.stickerModule.sendSticker;
        } else {
            console.warn('[EXPORTS] sendSticker function not available');
            modules.sendSticker = () => { throw new Error('sendSticker not available'); };
        }

        // Add null checks for critical utility functions
        if (modules.upload && typeof modules.upload !== 'function') {
            console.warn('[EXPORTS] Upload function not properly exported');
        }
        if (modules.tictactoe && typeof modules.tictactoe.invitePlayer !== 'function') {
            console.warn('[EXPORTS] TicTacToe invitePlayer not available');
        }
        if (modules.commandStats && typeof modules.commandStats.getMostUsedCommands !== 'function') {
            console.warn('[EXPORTS] CommandStats functions not available');
        }

        // --- private (ESM via dynamic import) ---
        const [antitoxicMod, antipalavraMod, antistickerplusMod] = await Promise.all([
            import('../security/guards/antitoxic.js'),
            import('../security/guards/antipalavra.js'),
            import('../security/guards/antistickerplus.js'),
        ]);

        // Private modules with null checking
        modules.antitoxic = antitoxicMod.default ?? antitoxicMod;
        modules.antipalavra = antipalavraMod.default ?? antipalavraMod;
        modules.antistickerplus = antistickerplusMod.default ?? antistickerplusMod;



        return modules;
    })();

    return modulesPromise;
}

/**
 * Named async accessor for callers that prefer explicit async usage.
 */
export async function getModules() {
    return await loadModules();
}

/**
 * Estado do carregamento dos módulos.
 * - `null`    : ainda carregando
 * - `Object`  : pronto e disponível
 * - `Error`   : falha crítica no carregamento
 */
let loadedModules = null;
let loadError = null;

const modulesReadyPromise = loadModules().then(m => {
    loadedModules = m;
}).catch(e => {
    loadError = e;
    console.error('[EXPORTS] Falha crítica ao carregar módulos:', e);
});

/**
 * Garante que os módulos estão carregados antes de prosseguir.
 * Deve ser aguardado (await) durante o boot para evitar acesso prematuro.
 * @returns {Promise<void>}
 */
export async function ensureModulesLoaded() {
    await modulesReadyPromise;
    if (loadError) throw loadError;
}

/**
 * Verifica síncronamente se os módulos já estão disponíveis.
 * @returns {boolean}
 */
export function areModulesLoaded() {
    return loadedModules !== null && loadError === null;
}

/**
 * Proxy de acesso que LANÇA ERRO explícito quando módulos ainda carregam,
 * em vez de retornar `undefined` silenciosamente e mascarar bugs em runtime.
 */
const safeModules = new Proxy({}, {
    get(_target, prop) {
        if (typeof prop === 'symbol') return undefined;

        if (loadError) {
            throw new Error(`[EXPORTS] Módulos não puderam ser carregados: ${loadError.message}`);
        }
        if (!loadedModules) {
            throw new Error(
                `[EXPORTS] Módulo '${String(prop)}' acessado antes do boot terminar. ` +
                `Chame await ensureModulesLoaded() no startup.`
            );
        }
        if (!(prop in loadedModules)) {
            console.warn(`[EXPORTS] Module '${String(prop)}' not found in exports`);
            return undefined;
        }
        return loadedModules[prop];
    }
});

export default safeModules;
