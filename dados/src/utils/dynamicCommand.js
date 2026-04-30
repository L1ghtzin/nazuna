import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS_DIR = path.resolve(__dirname, '../commands');

let commandImports = null;

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
      results.push(itemPath);
    }
  }

  return results;
}

let commandLookupMap = null;

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

  await Promise.all(
    subdirectories.map(async (subdir) => {
      const subdirectoryPath = path.join(COMMANDS_DIR, subdir);

      const files = await Promise.all(
        readDirectoryRecursive(subdirectoryPath).map(async (filePath) => {
          try {
            const module = await import(pathToFileURL(filePath).href);
            const cmd = module.default ?? module;
            if (cmd && typeof cmd === 'object') {
              cmd.__filePath = filePath;
              if (cmd.commands && Array.isArray(cmd.commands)) {
                for (const c of cmd.commands) {
                  commandLookupMap.set(c.toLowerCase(), { type: subdir, command: cmd });
                }
              }
            }
            return cmd;
          } catch (err) {
            console.error(`Erro ao importar comando de ${filePath}:`, err);
            return null;
          }
        }),
      );

      commandImports[subdir] = files.filter(Boolean);
    }),
  );

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
    
    // Verificações de permissão com base na pasta (tipo) do comando
    if (type === 'owner' && !isOwner) {
        await reply("🚫 Este comando é apenas para o dono do bot!");
        return true; // Retorna true para indicar que já processou
    }
    
    if (type === 'admin') {
        if (!isGroup) {
            await reply("Isso só pode ser usado em grupo ❌");
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
        await reply("Ocorreu um erro ao executar este comando ❌");
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
