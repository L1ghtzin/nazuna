import { normalizar } from './formatting.js';

/**
 * Parse custom command meta tokens provided as tokens array (e.g., ['[admin]','[param:name:required]','rest','of','response'])
 * Returns an object with settings and the remaining tokens
 */
export function parseCustomCommandMeta(tokens) {
  const settings = {
    ownerOnly: false,
    adminOnly: false,
    context: 'both', // 'group' | 'private' | 'both'
    params: [], // { name, required, type }
    placeholders: {}
  };

  const rest = [];

  const metaRegex = /^\[(.*)\]$/;
  const angleRegex = /^<(.*)>$/;

  // consume meta tokens from the start
  let idx = 0;
  while (idx < tokens.length) {
    const t = tokens[idx];
    // support angle brackets grouping: <[param:a:required]/[param:b:optional]>
    const angleMatch = ('' + t).match(angleRegex);
    let partsToProcess = [];
    if (angleMatch) {
      // split inside by delimiters: / or | or , or space
      const inner = angleMatch[1].trim();
      // split tokens inside - they might be bracket tokens
      const innerParts = inner.split(/\s*[/|,]+\s*|\s+/).filter(Boolean);
      partsToProcess = innerParts;
    } else {
      const m = t.match(metaRegex);
      if (!m) break;
      const content = m[1].trim();
      partsToProcess = [content];
    }
    for (const raw of partsToProcess) {
      // Remove any surrounding [ ] from tokens (they may persist in angle groups)
      const contentPart = ('' + raw).trim().replace(/^\[|\]$/g, '').trim();
      if (!contentPart) continue;
      const parts = contentPart.split(':');
      const directive = parts[0].toLowerCase();
      switch (directive) {
      case 'admin':
        settings.adminOnly = true;
        break;
      case 'owner':
        settings.ownerOnly = true;
        break;
      case 'group':
        settings.context = 'group';
        break;
      case 'private':
        settings.context = 'private';
        break;
      case 'both':
        settings.context = 'both';
        break;
      case 'param': {
        // syntax: param[:type]:name:required|optional
        // Examples:
        // [param:name:required]
        // [param:number:age:optional]
        const parts2 = parts.slice(1).filter(Boolean);
        let type = 'string';
        let name = '';
        let required = false;
        let restFlag = false;
        let min = undefined;
        let max = undefined;
        let def = undefined;
        let regex = undefined;
        let enumVals = undefined;
        // parts2 can contain type/name/required/rest/min=.../max=.../default=.../regex=.../enum=val1|val2
        for (let tok of parts2) {
          tok = tok.trim();
          if (!tok) continue;
          const tl = tok.toLowerCase();
          if (tl === 'required') {
            required = true;
            continue;
          }
          if (tl === 'optional') {
            required = false;
            continue;
          }
          if (tl === 'rest' || tl === '...') {
            restFlag = true;
            continue;
          }
          // key=value
          if (tok.includes('=')) {
            const [k, ...restParts2] = tok.split('=');
            const v = restParts2.join('=');
            const key = k.trim().toLowerCase();
            if (key === 'min') min = Number(v);
            else if (key === 'max') max = Number(v);
            else if (key === 'default' || key === 'def') def = v;
            else if (key === 'regex' || key === 'pattern') regex = v;
            else if (key === 'enum') {
              enumVals = v.split('|').map(x => x.trim()).filter(Boolean);
            }
            continue;
          }
          // if recognized types
          const recognizedTypes = ['number', 'int', 'float', 'string', 'boolean', 'regex', 'enum'];
          if (recognizedTypes.includes(tl)) {
            type = tl;
            continue;
          }
          // fallback: treat as name
          if (!name) name = tok;
        }
        if (!name && parts2.length > 0) name = parts2[0];
        if (name) {
          const pName = normalizeParamName(name);
          const paramObj = { name: pName, required: !!required, type, rest: !!restFlag };
          if (min !== undefined) paramObj.min = min;
          if (max !== undefined) paramObj.max = max;
          if (def !== undefined) paramObj.default = def;
          if (regex !== undefined) paramObj.pattern = regex;
          if (enumVals !== undefined) paramObj.enum = enumVals;
          settings.params.push(paramObj);
        }
        break;
      }
      case 'placeholder': {
        // syntax: placeholder:key=value
        const restParts = content.split(':').slice(1).join(':');
        const eqIndex = restParts.indexOf('=');
        if (eqIndex > -1) {
          const key = restParts.slice(0, eqIndex).trim();
          const val = restParts.slice(eqIndex + 1).trim();
          if (key) settings.placeholders[key] = val;
        }
        break;
      }
      default: {
        // unknown token -> fallback to param parsing if it looks like a param
        // Accept patterns like: name:required OR type:name:required OR name:type:required OR name
        const fallbackParts = parts;
        // Determine required by last part
        const last = fallbackParts[fallbackParts.length - 1].toLowerCase();
        const required = last === 'required' || last === 'optional' ? last === 'required' : false;
        // find type if any
        let type = 'string';
        let name = null;
        // remove last if it's required/optional
        const coreParts = required ? fallbackParts.slice(0, -1) : fallbackParts.slice();
        // find a recognized type token
        const recognizedTypes = ['number', 'int', 'float', 'string'];
        let idxType = coreParts.findIndex(p => recognizedTypes.includes(p.toLowerCase()));
        if (idxType !== -1) {
          type = coreParts[idxType].toLowerCase();
          // remove type from coreParts
          coreParts.splice(idxType, 1);
        }
        // the remaining part(s) likely hold the name; prefer the first non-empty
        for (const p2 of coreParts) {
          if (p2 && !recognizedTypes.includes(p2.toLowerCase())) {
            name = p2;
            break;
          }
        }
        if (!name && coreParts.length > 0) name = coreParts[0];
        if (name) {
          settings.params.push({ name: normalizar(name), required: !!required, type });
        }
        break;
      }
      }
    }
    idx++;
  }

  // remaining tokens
  for (let j = idx; j < tokens.length; j++) {
    rest.push(tokens[j]);
  }

  return { settings, rest };
}

export function buildUsageFromParams(trigger, params = []) {
  // params = [{ name, required, type, default, min, max, rest, enum }]
  const parts = params.map(p => {
    const type = (p.type || 'string');
    const rest = p.rest ? '...' : '';
    const def = typeof p.default !== 'undefined' ? `=${p.default}` : '';
    const minMax = (typeof p.min !== 'undefined' || typeof p.max !== 'undefined') ? `:${p.min || ''}-${p.max || ''}` : '';
    const enumList = Array.isArray(p.enum) && p.enum.length ? `:${p.enum.join('|')}` : '';
    const core = `${p.name}:${type}${rest}${def}${minMax}${enumList}`;
    return p.required ? `<${core}>` : `[${core}]`;
  });
  return `${trigger}${parts.length ? ' ' + parts.join(' ') : ''}`;
}

/**
 * Parse argument string using delimiters like | or / or spaces and supports angle bracket wrap <...>
 * Returns array of tokens
 */
export function parseArgsFromString(input) {
  const s = (input || '').trim();
  if (!s) return [];
  let inner = s;
  if (inner.startsWith('<') && inner.endsWith('>')) {
    inner = inner.slice(1, -1).trim();
  }
  if (inner.includes('|')) {
    return inner.split(/\s*\|\s*/).map(x => x.trim()).filter(Boolean);
  }
  if (inner.includes('/')) {
    return inner.split(/\s*\/\s*/).map(x => x.trim()).filter(Boolean);
  }
  return inner.split(/\s+/).filter(Boolean);
}

// Ensure a parameter name is valid: lowercase, diacritics stripped, spaces -> underscores, only a-z0-9_ chars
export function normalizeParamName(name) {
  if (!name || typeof name !== 'string') return '';
  const n = normalizar(name || '');
  // replace non-alphanumeric/underscore with underscore
  return n.replace(/[^a-z0-9_]/g, '_');
}

// Validate a parameter value against its definition
export function validateParamValue(value, def = {}) {
  if (typeof def !== 'object') return { ok: true };
  const t = def.type || 'string';
  if ((typeof value === 'undefined' || value === null || value === '') && typeof def.default !== 'undefined') {
    value = def.default;
  }
  if ((typeof value === 'undefined' || value === null || value === '') && def.required) {
    return { ok: false, message: `Parâmetro ${def.name} é obrigatório.` };
  }
  if (typeof value === 'undefined' || value === null || value === '') return { ok: true };
  switch (t) {
    case 'int': {
      const n = Number(value);
      if (isNaN(n) || !Number.isInteger(n)) return { ok: false, message: `Parâmetro ${def.name} deve ser um inteiro.` };
      if (def.min !== undefined && n < def.min) return { ok: false, message: `Parâmetro ${def.name} deve ser >= ${def.min}.` };
      if (def.max !== undefined && n > def.max) return { ok: false, message: `Parâmetro ${def.name} deve ser <= ${def.max}.` };
      return { ok: true };
    }
    case 'float':
    case 'number': {
      const n = Number(value);
      if (isNaN(n)) return { ok: false, message: `Parâmetro ${def.name} deve ser numérico.` };
      if (def.min !== undefined && n < def.min) return { ok: false, message: `Parâmetro ${def.name} deve ser >= ${def.min}.` };
      if (def.max !== undefined && n > def.max) return { ok: false, message: `Parâmetro ${def.name} deve ser <= ${def.max}.` };
      return { ok: true };
    }
    case 'boolean': {
      const lv = ('' + value).toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no', 'sim', 'nao', 'não'].includes(lv)) {
        return { ok: false, message: `Parâmetro ${def.name} deve ser booleano (true/false).` };
      }
      return { ok: true };
    }
    case 'regex': {
      try {
        const re = new RegExp(def.pattern);
        return re.test(value) ? { ok: true } : { ok: false, message: `Parâmetro ${def.name} não corresponde ao padrão.` };
      } catch (e) {
        return { ok: false, message: `Padrão regex inválido: ${def.pattern}` };
      }
    }
    case 'enum': {
      if (Array.isArray(def.enum) && def.enum.length && !def.enum.includes(value)) {
        return { ok: false, message: `Parâmetro ${def.name} deve ser um de: ${def.enum.join(', ')}` };
      }
      return { ok: true };
    }
    default:
      // string, default accepts
      return { ok: true };
  }
}
