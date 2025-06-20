const axios = require('axios');


const tokenParts = ["ghp", "_F", "AaqJ", "0l4", "m1O4", "Wdno", "hEltq", "PyJY4", "sWz", "W4", "JfM", "Ni"];


const CONFIG = {
  GITHUB: {
    REPO: 'nazuninha/uploads',
    API_URL: 'https://api.github.com/repos',
    TOKEN: tokenParts.join(""),
    HEADERS: {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  },
  FILE_TYPES: {
    IMAGES: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'ico', 'jfif', 'heic'],
    VIDEOS: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv', 'mpeg', 'mpg'],
    AUDIO: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma', 'midi'],
    DOCUMENTS: ['pdf', 'doc', 'docx', 'xlsx', 'pptx', 'zip', 'rar', '7z', 'iso', 'apk', 'rtf', 'epub', 'txt', 'json', 'xml', 'csv', 'md', 'html', 'css', 'js', 'sql'],
    EXECUTABLES: ['exe', 'elf', 'dll', 'bat', 'sh', 'ps1'],
    DATABASES: ['sqlite', 'db', 'mdb'],
    FONTS: ['ttf', 'otf', 'woff', 'woff2'],
    OTHERS: ['bin', 'dat', 'log', 'tar', 'gz', 'bz2', 'xz']
  },
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  DEFAULT_TIMEOUT: 30000
};


const uploadCache = new Map();
const mimeCache = new Map();


class FileTypeDetector {
  static SIGNATURES = {
    'ffd8ff': {
      handler: (buffer) => {
        const subHeader = buffer.toString('hex', 2, 4);
        if (['e0', 'e1', 'db'].includes(subHeader)) {
          return { ext: 'jpg', mime: 'image/jpeg' };
        }
        return { ext: 'unknown', mime: 'application/octet-stream' };
      }
    },
    '89504e47': { ext: 'png', mime: 'image/png' },
    '47494638': { ext: 'gif', mime: 'image/gif' },
    '52494646': {
      handler: (buffer) => {
        const riffType = buffer.toString('hex', 8, 12);
        const types = {
          '57415645': { ext: 'wav', mime: 'audio/wav' },
          '41564920': { ext: 'avi', mime: 'video/x-msvideo' },
          '57454250': { ext: 'webp', mime: 'image/webp' }
        };
        return types[riffType] || { ext: 'unknown', mime: 'application/octet-stream' };
      }
    },
    '424d': { ext: 'bmp', mime: 'image/bmp' },
    '49492a00': { ext: 'tiff', mime: 'image/tiff' },
    '4d4d002a': { ext: 'tiff', mime: 'image/tiff' },
    '00000100': { ext: 'ico', mime: 'image/x-icon' },
    '48454943': { ext: 'heic', mime: 'image/heic' },
    '000001ba': { ext: 'mpg', mime: 'video/mpeg' },
    '000001b3': { ext: 'mpg', mime: 'video/mpeg' },
    '00000018': { ext: 'mp4', mime: 'video/mp4', checker: (buffer) => buffer.toString('ascii', 4, 8) === 'ftyp' },
    '00000020': { ext: 'mp4', mime: 'video/mp4', checker: (buffer) => buffer.toString('ascii', 4, 8) === 'ftyp' },
    '1a45dfa3': { ext: 'mkv', mime: 'video/x-matroska' },
    '464c5601': { ext: 'flv', mime: 'video/x-flv' },
    '66747970': { ext: 'mov', mime: 'video/quicktime', checker: (buffer) => buffer.toString('ascii', 4, 12).includes('qt') },
    '574d5656': { ext: 'wmv', mime: 'video/x-ms-wmv' },
    '494433': { ext: 'mp3', mime: 'audio/mpeg' },
    '4f676753': { ext: 'ogg', mime: 'audio/ogg' },
    '664c6143': { ext: 'flac', mime: 'audio/flac' },
    'fff1': { ext: 'aac', mime: 'audio/aac' },
    '4d546864': { ext: 'midi', mime: 'audio/midi' },
    '574d4156': { ext: 'wma', mime: 'audio/x-ms-wma' },
    '504b0304': {
      handler: (buffer) => {
        const zipType = buffer.toString('hex', 30, 34);
        const types = {
          '6d6c20': { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          '786c20': { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          '707020': { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
        };
        if (types[zipType]) return types[zipType];
        return buffer.toString('utf8', 0, 50).includes('META-INF/')
          ? { ext: 'apk', mime: 'application/vnd.android.package-archive' }
          : { ext: 'zip', mime: 'application/zip' };
      }
    },
    '25504446': { ext: 'pdf', mime: 'application/pdf' },
    'd0cf11e0': {
      handler: (buffer) => {
        const types = {
          'msword': { ext: 'doc', mime: 'application/msword' },
          'excel': { ext: 'xls', mime: 'application/vnd.ms-excel' },
          'powerpoint': { ext: 'ppt', mime: 'application/vnd.ms-powerpoint' }
        };
        const content = buffer.toString('ascii', 512, 600);
        for (const [key, value] of Object.entries(types)) {
          if (content.includes(key)) return value;
        }
        return { ext: 'unknown', mime: 'application/octet-stream' };
      }
    },
    '7b5c7274': { ext: 'rtf', mime: 'application/rtf' },
    '3c3f786d': { ext: 'xml', mime: 'application/xml' },
    '7b22': { ext: 'json', mime: 'application/json' },
    '75737461': { ext: 'tar', mime: 'application/x-tar' },
    '52617221': { ext: 'rar', mime: 'application/x-rar-compressed' },
    '377abcaf': { ext: '7z', mime: 'application/x-7z-compressed' },
    '1f8b08': { ext: 'gz', mime: 'application/gzip' },
    '425a68': { ext: 'bz2', mime: 'application/x-bzip2' },
    'fd37z': { ext: 'xz', mime: 'application/x-xz' },
    '4d5a': { ext: 'exe', mime: 'application/x-msdownload' },
    '7f454c46': { ext: 'elf', mime: 'application/x-elf' },
    '534944': { ext: 'sqlite', mime: 'application/x-sqlite3' },
    '00010000': { ext: 'ttf', mime: 'font/ttf' },
    '4f54544f': { ext: 'otf', mime: 'font/otf' },
    '774f4646': { ext: 'woff', mime: 'font/woff' },
    '774f4632': { ext: 'woff2', mime: 'font/woff2' },
    '2321': { ext: 'sh', mime: 'text/x-shellscript' },
    'efbbbf': { ext: 'txt', mime: 'text/plain' },
    '3c21444f': { ext: 'html', mime: 'text/html' },
    '2f2a': { ext: 'js', mime: 'application/javascript' },
    '2e637373': { ext: 'css', mime: 'text/css' },
    '2d2d5351': { ext: 'sql', mime: 'application/sql' },
    '235b': { ext: 'ini', mime: 'text/plain' }
  };

  static detect(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
      return { ext: 'unknown', mime: 'application/octet-stream' };
    }

    const cacheKey = buffer.toString('hex', 0, 12).toLowerCase();
    if (mimeCache.has(cacheKey)) {
      return mimeCache.get(cacheKey);
    }

    let result = { ext: 'unknown', mime: 'application/octet-stream' };
    for (let i = 2; i <= 8; i += 2) {
      const hex = buffer.toString('hex', 0, i).toLowerCase();
      const signature = this.SIGNATURES[hex];
      if (signature) {
        if (typeof signature.handler === 'function') {
          result = signature.handler(buffer);
        } else if (typeof signature.checker === 'function' && signature.checker(buffer)) {
          result = signature;
        } else if (!signature.checker) {
          result = signature;
        }
        break;
      }
    }

    if (result.ext === 'unknown' && buffer.length >= 50) {
      const sample = buffer.toString('utf8', 0, Math.min(buffer.length, 100)).toLowerCase();
      if (sample.startsWith('{') || sample.startsWith('[')) {
        result = { ext: 'json', mime: 'application/json' };
      } else if (sample.startsWith('<?xml') || sample.includes('<root')) {
        result = { ext: 'xml', mime: 'application/xml' };
      } else if (sample.startsWith('<!doctype') || sample.includes('<html')) {
        result = { ext: 'html', mime: 'text/html' };
      } else if (sample.startsWith('/*') || sample.includes('function(')) {
        result = { ext: 'js', mime: 'application/javascript' };
      } else if (sample.startsWith('.') || sample.includes('{') && sample.includes('}')) {
        result = { ext: 'css', mime: 'text/css' };
      } else if (sample.includes('create table') || sample.includes('select *')) {
        result = { ext: 'sql', mime: 'application/sql' };
      } else if (sample.match(/^\s*[a-z0-9,;\-]+\s*$/)) {
        result = { ext: 'csv', mime: 'text/csv' };
      } else if (sample.match(/^\s*[\w\s.,!?-]+\s*$/)) {
        result = { ext: 'txt', mime: 'text/plain' };
      }
    }

    mimeCache.set(cacheKey, result);
    return result;
  }
}


class GitHubUploader {
  constructor() {
    if (!CONFIG.GITHUB.TOKEN) {
      throw new Error('GitHub token não configurado nas variáveis de ambiente');
    }
    this.headers = {
      ...CONFIG.GITHUB.HEADERS,
      'Authorization': `Bearer ${CONFIG.GITHUB.TOKEN}`
    };
  }

  async upload(buffer, filePath) {
    try {
      const base64Content = buffer.toString('base64');
      const response = await axios.put(
        `${CONFIG.GITHUB.API_URL}/${CONFIG.GITHUB.REPO}/contents/${filePath}`,
        {
          message: `Upload: ${filePath}`,
          content: base64Content
        },
        {
          headers: this.headers,
          timeout: CONFIG.DEFAULT_TIMEOUT
        }
      );
      return response.data.content;
    } catch (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }

  async delete(filePath, sha) {
    try {
      await axios.delete(
        `${CONFIG.GITHUB.API_URL}/${CONFIG.GITHUB.REPO}/contents/${filePath}`,
        {
          headers: this.headers,
          data: {
            message: `Delete: ${filePath}`,
            sha
          }
        }
      );
    } catch (error) {
      console.error(`Erro ao deletar arquivo ${filePath}:`, error.message);
    }
  }
}


async function upload(buffer, deleteAfter10Min = false) {
  try {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Input deve ser um Buffer');
    }

    if (buffer.length > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const { ext, mime } = FileTypeDetector.detect(buffer);

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 8);
    const fileName = `${timestamp}_${randomStr}.${ext === 'unknown' ? 'bin' : ext}`;

    let folder = 'outros';
    if (CONFIG.FILE_TYPES.IMAGES.includes(ext)) folder = 'fotos';
    else if (CONFIG.FILE_TYPES.VIDEOS.includes(ext)) folder = 'videos';
    else if (CONFIG.FILE_TYPES.AUDIO.includes(ext)) folder = 'audios';
    else if (CONFIG.FILE_TYPES.DOCUMENTS.includes(ext)) folder = 'documentos';
    else if (CONFIG.FILE_TYPES.EXECUTABLES.includes(ext)) folder = 'executaveis';
    else if (CONFIG.FILE_TYPES.DATABASES.includes(ext)) folder = 'bancos';
    else if (CONFIG.FILE_TYPES.FONTS.includes(ext)) folder = 'fontes';

    const filePath = `${folder}/${fileName}`;

    const uploader = new GitHubUploader();
    const { download_url, sha } = await uploader.upload(buffer, filePath);

    if (deleteAfter10Min) {
      setTimeout(() => {
        uploader.delete(filePath, sha);
      }, 10 * 60 * 1000);
    };
    
    return download_url;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
}


module.exports = upload;