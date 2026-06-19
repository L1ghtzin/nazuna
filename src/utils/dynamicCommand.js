import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS_DIR = path.resolve(__dirname, '../commands');
const IGNORED_COMMAND_FILES = new Set([
  'owner/owner_broadcast.js',
  'owner/personalizargrupo.js',
]);

let commandImports = null;
let duplicateCommandAliases = [];

function formatCommandPath(filePath) {
  return path.relative(COMMANDS_DIR, filePath).replace(/\\/g, '/');
}

function shouldLoadCommandFile(filePath) {
  return !IGNORED_COMMAND_FILES.has(formatCommandPath(filePath));
}

function readDirectoryRecursive(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of list) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...readDirectoryRecursive(itemPath));
    } else if (
      !item.name.startsWith("_") &&
      (item.name.endsWith(".js") || item.name.endsWith(".ts"))
    ) {
      if (shouldLoadCommandFile(itemPath)) {
        results.push(itemPath);
      }
    }
  }

  return results;
}

let commandLookupMap = null;

function registerCommandAlias(alias, type, command) {
  const normalizedAlias = String(alias).toLowerCase();
  const existing = commandLookupMap.get(normalizedAlias);

  if (existing) {
    const duplicate = {
      alias: normalizedAlias,
      first: formatCommandPath(existing.command.__filePath),
      duplicate: formatCommandPath(command.__filePath)
    };
    duplicateCommandAliases.push(duplicate);
    console.error(
      `[COMMANDS] Alias duplicado "${normalizedAlias}" ignorado em ${duplicate.duplicate}; ` +
      `já registrado em ${duplicate.first}.`
    );
    return;
  }

  commandLookupMap.set(normalizedAlias, { type, command });
}

export async function readCommandImports() {
  if (commandImports) return commandImports;
  
  if (!fs.existsSync(COMMANDS_DIR)) {
    return {};
  }

  const subdirectories = fs
    .readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((directory) => directory.isDirectory())
    .map((directory) => directory.name);

  commandImports = {};
  commandLookupMap = new Map();
  duplicateCommandAliases = [];

  for (const subdir of subdirectories.sort()) {
    const subdirectoryPath = path.join(COMMANDS_DIR, subdir);
    const files = [];

    for (const filePath of readDirectoryRecursive(subdirectoryPath).sort()) {
      try {
        const module = await import(pathToFileURL(filePath).href);
        const cmd = module.default ?? module;
        if (cmd && typeof cmd === 'object') {
          cmd.__filePath = filePath;
          if (Array.isArray(cmd.commands)) {
            for (const c of cmd.commands) {
              registerCommandAlias(c, subdir, cmd);
            }
          }
        }
        files.push(cmd);
      } catch (err) {
        console.error(`Erro ao importar comando de ${filePath}:`, err);
      }
    }

    commandImports[subdir] = files.filter(Boolean);
  }

  return commandImports;
}

export async function findCommandImport(commandName) {
  await readCommandImports();
  const lowerName = commandName.toLowerCase();
  
  if (commandLookupMap && commandLookupMap.has(lowerName)) {
    return commandLookupMap.get(lowerName);
  }

  return { type: "", command: null };
}

export async function execDynamicCommand(commandName, paramsHandler) {
    const { type, command } = await findCommandImport(commandName);
    
    if (!command) {
        return false; // Comando não encontrado no loader dinâmico
    }
    
    const { isOwner, isGroupAdmin, isBotAdmin, reply, isGroup } = paramsHandler;
    
    if (type === 'owner' && !isOwner && !paramsHandler.isOwnerOrSub) {
        await reply(paramsHandler.MESSAGES.permission.subOwnerOnly);
        return true; // Retorna true para indicar que já processou
    }
    if (type === 'admin') {
        if (!isGroup) {
            await reply(paramsHandler.MESSAGES.permission.groupOnly);
            return true;
        }
        if (!isGroupAdmin && !isOwner && !paramsHandler.isOwnerOrSub) {
            await reply(paramsHandler.MESSAGES.permission.adminOnly);
            return true;
        }
    }
    
    try {
        const __filename = command.__filePath;
        const __dirname = path.dirname(__filename);
        await command.handle({ ...paramsHandler, type, __filename, __dirname });
        return true;
    } catch (error) {
        console.error(`Erro ao executar o comando ${commandName}:`, error);
        await reply(paramsHandler.MESSAGES?.error?.general || "Ocorreu um erro ao executar este comando ❌");
        return true;
    }
}

export async function getAllCommandList() {
    const commandList = await readCommandImports();
    const names = new Set();
    for (const group of Object.values(commandList)) {
        for (const cmd of group) {
            if (Array.isArray(cmd.commands)) {
                cmd.commands.forEach(c => names.add(c));
            }
        }
    }
    return Array.from(names);
}

export async function getTotalCommands() {
    const commandList = await getAllCommandList();
    return commandList.length;
}

export async function getDuplicateCommandAliases() {
    await readCommandImports();
    return [...duplicateCommandAliases];
}
