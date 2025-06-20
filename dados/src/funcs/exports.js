const fs = require('fs').promises;
const path = require('path');


function loadModule(modulePath, moduleName) {
  try {
    return require(modulePath);
  } catch (error) {
    return undefined;
  };
};


async function loadJson(filePath, fileName) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return undefined;
  };
};


async function loadRemoteModuleWithRetry(url, moduleName, maxRetries = 5, retryInterval = 500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const module = await requireRemote(url);
      return module;
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } else {
        return {};
      };
    };
  };
};


const utilsDir = path.join(__dirname, 'utils');
const jsonDir = path.join(__dirname, 'json');


const { requireRemote } = loadModule(path.join(utilsDir, 'import.js'), 'import');


const remoteModuleUrls = {
  youtube: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/downloads/youtube.js',
  tiktok: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/downloads/tiktok.js',
  pinterest: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/downloads/pinterest.js',
  igdl: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/downloads/igdl.js',
  Lyrics: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/downloads/lyrics.js',
  mcPlugin: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/downloads/mcplugins.js',
  FilmesDL: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/downloads/filmes.js',
  styleText: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/utils/gerarnick.js',
  ia: 'https://gitlab.com/hiudyy/nazuna-funcs/-/raw/main/funcs/private/ia.js'
};


const emojiMix = loadModule(path.join(utilsDir, 'emojimix.js'), 'emojiMix');
const upload = loadModule(path.join(utilsDir, 'upload.js'), 'upload');
const tictactoe = loadModule(path.join(utilsDir, 'tictactoe.js'), 'tictactoe');
const sendSticker = loadModule(path.join(utilsDir, 'sticker.js'), 'sendSticker').sendSticker;
const commandStats = loadModule(path.join(utilsDir, 'commandStats.js'), 'commandStats');


module.exports = (async () => {

  const modules = {
    youtube: undefined,
    tiktok: undefined,
    pinterest: undefined,
    igdl: undefined,
    mcPlugin: undefined,
    FilmesDL: undefined,
    styleText: undefined,
    ia: undefined
  };

  try {
  
    const downloadPromises = Object.entries(remoteModuleUrls).map(async ([key, url]) => {
      modules[key] = await loadRemoteModuleWithRetry(url, key);
      modules[key] = modules[key].default ? modules[key].default : modules[key]
    });

    const jsonPromises = [
      loadJson(path.join(jsonDir, 'tools.json'), 'tools.json').then(data => ({ toolsJson: data })),
      loadJson(path.join(jsonDir, 'vab.json'), 'vab.json').then(data => ({ vabJson: data }))
    ];

    await Promise.all([...downloadPromises, ...jsonPromises]);

    const toolsJson = (await jsonPromises[0]).toolsJson;
    const vabJson = (await jsonPromises[1]).vabJson;

    return {
      ...modules,
      sendSticker,
      emojiMix,
      upload,
      toolsJson: () => toolsJson,
      vabJson: () => vabJson,
      commandStats,
      tictactoe
    };
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro na inicialização:`, error.message);
    console.log(`[${new Date().toISOString()}] Retornando valores padrão após falha`);
    process.exit(0);
  }
})();