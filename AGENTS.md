---
trigger: always_on
---

# 🤖 GUIA DE AGENTES E DESENVOLVEDORES DO CHAINY

Este arquivo é a única fonte de verdade para agentes de IA e contribuidores que precisam de contexto rápido e confiável sobre o projeto **Chainy**. 

Use-o como a documentação principal para:
- Arquitetura e fluxo de execução do bot
- Regras de criação de comandos
- Regras de configuração e persistência de dados
- Diretrizes de Clean Code, commits, mensagens e performance

Para guias de instalação e uso, consulte o `README.md`.

---

## 🏗️ VISÃO GERAL DO PROJETO

O **Chainy** é um framework modular de bot para WhatsApp baseado no ecossistema da Nazuna.

Princípios principais:
- **Comandos baseados em arquivos:** Cada comando (ou conjunto de comandos relacionados) reside em seu próprio arquivo sob `src/commands/`.
- **Divisão de permissões por pastas:** 
  - `src/commands/owner/` -> Recursos do dono do bot (verificados automaticamente pelo despachante).
  - `src/commands/admin/` -> Recursos administrativos do grupo (verificados automaticamente pelo despachante).
  - `src/commands/member/` -> Comandos disponíveis para qualquer membro.
  - `src/commands/rpg/` -> Comandos do sistema de RPG integrado.
- **Cache otimizado e persistência JSON:** Os arquivos na pasta `dados/database/` são cacheados em memória e salvos usando otimizações de concorrência para evitar gargalos de disco.

---

## 📂 ESTRUTURA REAL DE PASTAS

```text
chainy/
├── dados/                       # Armazenamento e persistência de dados
│   ├── database/                # Cache em memória e arquivos JSON do banco
│   │   ├── grupos/              # Configurações de segurança e status de cada grupo
│   │   ├── dono/                # Credenciais, configurações globais e blacklist
│   │   ├── backups/             # Backups automáticos gerados por saveJsonFileSafe()
│   │   ├── qr-code/             # Credenciais de sessão do WhatsApp (Baileys)
│   │   └── tmp/                 # Arquivos temporários (mídias, cache de processamento)
├── src/
│   ├── commands/                # Comandos dinâmicos (separados por permissão)
│   │   ├── admin/               # Comandos administrativos do grupo
│   │   ├── member/              # Comandos livres para qualquer usuário
│   │   ├── owner/               # Comandos restritos ao dono do bot
│   │   └── rpg/                 # Comandos do sistema de RPG
│   ├── handlers/                # Manipuladores de eventos do Baileys (connection, messages, groupParticipants)
│   ├── middleware/              # Filtros de execução, limites, despacho e segurança
│   │   └── security/            # Submódulos de proteção (antiDel, antiSpam, mutedUsers, rentalMode, etc)
│   ├── funcs/                   # Integrações, serviços e dados estáticos
│   │   ├── downloads/           # Downloaders (YouTube, TikTok, Spotify, etc)
│   │   ├── utils/               # Utilitários de serviço (jogos, search, media, sticker)
│   │   ├── private/             # Segurança adicional (antitoxic, antipalavra, antistickerplus)
│   │   └── json/                # Bancos de dados estáticos de jogos (quiz, forca, stop, etc)
│   ├── views/                   # Geradores de texto dos menus exibidos pelo comando /menu
│   ├── utils/                   # Núcleo de utilitários do framework
│   │   ├── database/            # Submódulos do banco (economy, leveling, rental, config, support)
│   │   ├── helpers/             # Helpers puros (formatting, jsonIo, jidLidResolver, dataValidators, paramParser)
│   │   └── messages/            # Mensagens centralizadas por domínio (admin, member, owner, rpg, middleware, handlers, funcs, workers)
│   ├── workers/                 # Jobs agendados (cron) e workers em background
│   └── .scripts/                # Scripts npm (start, config, update) — não importar no código
└── package.json                 # Manifesto do projeto e scripts npm
```

---

## ⚙️ ARQUITETURA E FLUXO PRINCIPAL

1. `src/connect.js`: Inicia a conexão com o WhatsApp, carrega as credenciais, lida com emparelhamento/sessão e inicializa o Baileys.
2. `src/index.js`: Processador principal de mensagens. Delega o parsing inicial da mensagem.
3. `src/utils/contextBuilder.js`: Constrói o contexto. Extrai dados, converte JID para LID, injeta funções como `reply()` e avalia middlewares (anti-link, segurança, etc).
4. `src/middleware/commandDispatcher.js`: Verifica limites de uso, permissões e despacha a execução do comando baseado na pasta (`owner/`, `admin/`, etc).
5. `src/utils/dynamicCommand.js`: Importa dinamicamente os comandos indexados de `src/commands/`.
6. A função `handle()` do comando é executada com todo o contexto injetado.

---

## 📝 GUIA DE COMANDOS

Modelo padrão de comando:

```javascript
export default {
  name: "nome_do_comando",
  description: "Descrição do que o comando faz",
  commands: ["alias1", "alias2"],
  usage: `${global.prefixo}nome_do_comando <argumentos>`,
  handle: async ({ reply, q, isGroup, MESSAGES, saveJsonFileSafe, groupData, groupFile }) => {
    // Lógica do comando
    await reply(MESSAGES.geral.sucesso);
  },
};
```

**Regras Vitais de Autoria:**
1. **Sem verificações manuais de permissão:** Deixe o `commandDispatcher` fazer o trabalho. Não crie `if (!isGroupAdmin)` no início de um comando da pasta `admin/`.
2. **Mensagens centralizadas:** NUNCA use strings literais para mensagens de resposta (ex: `reply("Erro!")`). Sempre puxe de `MESSAGES` (mapeado de `src/utils/messages.js`).
3. **Persistência de Dados Segura:** NUNCA use `fs.readFileSync`/`fs.writeFileSync` ou importe diretamente de `utils/asyncFs.js`. Use **exclusivamente** a fachada unificada em `src/utils/database/io.js`:
   - `db.read(path, default)` — leitura síncrona com cache TTL de 30s (hot path).
   - `db.readAsync(path, default)` — leitura assíncrona (não bloqueia event loop).
   - `db.writeSafe(path, data)` — gravação síncrona atômica (write+rename) com backup automático. **Use para gravações dentro do `handle()` de comandos.**
   - `db.writeSync(path, data)` — gravação síncrona atômica sem backup. Variante mais leve quando o backup não for necessário.
   - `db.queue(path, data)` — gravação assíncrona com fila sequencial por arquivo (evita race conditions). **Use em workers, jobs agendados e tarefas em background.**
   - `db.debounced(path, data, delayMs=3000)` — debounce para gravações frequentes (economia, leveling). Evita flood de disco.
   - `db.exists(path)` / `db.existsSync(path)` — verificação de existência (async / sync).
   - `db.flush()` — força flush de todos os debounces pendentes (use no shutdown).
   - Importação: `import { read, writeSafe, queue } from '../../utils/database/io.js';` ou `import db from '../../utils/database/io.js';`

---

## 👨‍💻 REGRAS DO DESENVOLVEDOR E CLEAN CODE

1. **Nomes descritivos:** Nada de `data`, `item`, `x`, `temp`. Seja claro no nome das variáveis e funções.
2. **Funções focadas (Solid/MVC):** Separe responsabilidades. Validações complexas, formatações e regras de negócio não devem poluir o arquivo do comando principal.
3. **Mensagens Dinâmicas:** Centralize e crie funções nas mensagens quando precisar injetar variáveis: `` cooldown: (s) => `⏳ Aguarde ${s}s` ``.
4. **Performance:** Priorize operações em cache. Limite I/O de disco sempre que possível e evite dependências pesadas de terceiros.

---

## 📌 PADRÃO DE COMMITS (OBRIGATÓRIO)

Siga estritamente o formato de prefixo e verbos no infinitivo (ou presente):
- **Formato:** `chainy: descrição curta e clara da alteração`
- **Bons exemplos:**
  - `chainy: otimizar carregamento das páginas de grupos`
  - `chainy: corrigir acesso a mensagens no rpg`
- **Proibido:** `update`, `fix`, `changes`, `chainy: correções gerais`.

---

## 🤖 REGRAS DO AGENTE DE IA (CRÍTICO)

Agente de IA, ao trabalhar neste repositório:
1. **Respeite a Arquitetura:** Nunca injete lógicas que contornem os middlewares e gerenciadores de estado globais.
2. **Fuja de Gambiarras (Hacks):** Se encontrar um bug complexo (como uma *Race Condition* em salvamentos), **NÃO FAÇA** workarounds no local do erro (ex: usar `setTimeout` para forçar um salvamento). Investigue a raiz do problema (camada de I/O, cache) e corrija a arquitetura da forma correta.
3. **Investigação Prévia:** Sempre use ferramentas nativas (`grep_search`, `view_file`) para mapear o uso de variáveis e métodos antes de propor uma alteração.
4. **Segurança:** Nunca exponha arquivos de autenticação de sessão ou chaves privadas/tokens de autenticação. Mantenha as modificações locais, focadas e granulares.
