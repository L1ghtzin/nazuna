---
trigger: always_on
---

# GUIA DE AGENTES E DESENVOLVEDORES DO CHAINY

Este arquivo é a única fonte de verdade para agentes de IA e contribuidores que precisam de contexto rápido e confiável sobre o projeto **Chainy**.

Use-o como a documentação principal para:
- arquitetura e fluxo de execução do bot
- regras de criação de comandos
- regras de configuração e persistência de dados
- diretrizes de Clean Code, commits, mensagens e performance

Para guias de instalação e uso, consulte o `README.md`.

---

## VISÃO_GERAL_DO_PROJETO

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

## ARQUITETURA

Fluxo de execução principal:
1. `src/connect.js` inicia a conexão com o WhatsApp, carrega as credenciais, lida com emparelhamento/sessão e chama o ponto de entrada.
2. `src/index.js` age como o processador principal de mensagens. Ele delega o parsing da mensagem para `buildMessageContext`.
3. `src/utils/contextBuilder.js` extrai os dados, converte JID para LID usando cache, injeta funções auxiliares (`reply()`, `reagir()`) e avalia middlewares globais (anti-link, parcerias, segurança de mídia, etc.).
4. `src/middleware/commandDispatcher.js` verifica limites de uso de comando, permissão VIP e despacha a execução.
5. `src/utils/dynamicCommand.js` localiza o comando de forma recursiva em `src/commands/` e valida as permissões com base na pasta do arquivo.
6. A função `handle()` do comando correspondente é executada com o contexto injetado.

---

## ARQUIVOS_PRINCIPAIS

| Caminho | Responsabilidade |
| --- | --- |
| `src/connect.js` | Configuração de conexão, arquivos de sessão, inicialização do socket do Baileys. |
| `src/index.js` | Fluxo principal de análise de mensagens e pipeline de middlewares globais. |
| `src/utils/paths.js` | Resolução de caminhos absolutos para todas as configurações e arquivos de banco de dados. |
| `src/utils/contextBuilder.js` | Constrói o objeto unificado de parâmetros passado para as funções de handle dos comandos. |
| `src/utils/dynamicCommand.js` | Importa e indexa dinamicamente os comandos; gerencia a execução e permissões globais. |
| `src/middleware/commandDispatcher.js` | Coordena limites, restrições VIP e despacho de comandos dinâmicos. |
| `src/utils/database.js` | Leitura/escrita do banco, configurações e funções auxiliares de integridade de dados. |
| `src/utils/messages.js` | Ponto de entrada para as mensagens localizadas enviadas ao usuário final. |

---

## GUIA_DE_COMANDOS

Modelo de comando:

```javascript
export default {
  name: "nome_do_comando",
  description: "Descrição do que o comando faz",
  commands: ["alias1", "alias2"],
  usage: `${global.prefixo}nome_do_comando <argumentos>`,
  handle: async ({ reply, q, isGroup, MESSAGES }) => {
    // Lógica do comando
    await reply("Sucesso!");
  },
};
```

Regras de autoria de comandos:
- **Sem verificações manuais de permissão:** Não faça checagens manuais de permissão de admin ou dono dentro do código do comando, a menos que haja uma validação muito específica que fuja da regra da pasta correspondente (`admin`/`owner`).
- **Mensagens centralizadas:** Sempre extraia os textos de resposta do parâmetro `MESSAGES` (que puxa de `src/utils/messages.js` ou seus módulos em `src/utils/messages/`).
- **Acesso ao banco:** Sempre use o `optimizer` injetado (ex: `optimizer.saveJsonWithCache()`) ou helpers do `database.js` em vez de ler arquivos JSON diretamente com `fs.readFileSync` para evitar dessincronização de cache.

---

## REGRAS_DE_DADOS

Os arquivos de dados residem em `dados/database/`.

Diretrizes importantes:
- **Nunca** leia estes arquivos diretamente com `fs.readFileSync` dentro de comandos.
- Use `optimizer.getCachedFile()` ou `optimizer.saveJsonWithCache()` para interagir de forma segura e rápida com as configurações e banco de dados.
- Mapeamentos de caminhos devem ser sempre importados de `src/utils/paths.js`.

---

## REGRAS_DO_DESENVOLVEDOR

### 1. Regras de Clean Code
Sempre que for criar, alterar ou refatorar código neste projeto, siga as seguintes diretrizes:
- **Nomes descritivos:** Use nomes descritivos para variáveis, funções, arquivos e componentes. Evite nomes genéricos como `data`, `item`, `x`, `temp`, `teste` quando existir um nome mais claro.
- **Funções focadas:** Crie funções pequenas, com uma responsabilidade bem definida. Evite funções gigantes fazendo várias coisas ao mesmo tempo.
- **Remoção de código morto:** Delete comentários inúteis, `console.log` desnecessários e trechos duplicados.
- **MVC e Separação de Conceitos:** Não misture responsabilidades no mesmo arquivo. Separe validações, chamadas externas, formatações e regras complexas em funções próprias.
- **Consistência:** Mantenha o código consistente com o padrão já usado no projeto.

### 2. Regras de Mensagens e Traduções (`messages.js`)
Sempre que for criar ou alterar qualquer mensagem exibida para o usuário (erros, avisos, permissões, logs, etc.), verifique se ela deve ficar centralizada nos arquivos de mensagem.
- **Objetivo:** Evitar strings hardcoded espalhadas pelo código.
- **Centralização:** Use o arquivo central `src/utils/messages.js` e seus arquivos auxiliares em `src/utils/messages/*.js`.
- **Padrão:**
  - *Incorreto:* `reply('❌ Você não tem permissão para usar esse comando.')`
  - *Correto:* `reply(MESSAGES.permission.adminOnly)`
- **Mensagens Dinâmicas:** Quando a mensagem precisar de parâmetros, crie funções nas mensagens (ex: `cooldown: (seconds) => `⏳ Aguarde ${seconds}s...``).

### 3. Regras de Nomenclatura de Commits
Ao realizar ou sugerir commits, siga obrigatoriamente estas regras:
- **Formato obrigatório:** Use sempre o prefixo `chainy:` no início da mensagem.
  ```txt
  chainy: descrição curta e clara da alteração
  ```
- **Estilo:** Descrição curta, direta, em português, sem ponto final, usando verbos no infinitivo (ou presente se mais natural):
  - *Bons exemplos:*
    - `chainy: otimizar carregamento das páginas de grupos`
    - `chainy: remover logs desnecessários do backend`
    - `chainy: corrigir login do painel admin`
- **Evite genéricos:** Nunca use `update`, `fix`, `changes`, `correções` ou mensagens vagas como `chainy: atualiza arquivos`.

### 4. Regras de Performance
Sempre considere performance, cache e carregamento rápido nas alterações:
- Evite consultas e leituras de disco desnecessárias.
- Preserve ou melhore o cache utilizando a API de cache do `optimizer`.
- Não adicione dependências/bibliotecas de terceiros pesadas sem necessidade real.
- Priorize melhorias que reduzam consumo de memória e chamadas repetidas a APIs externas.

---

## REGRAS_DO_AGENTE_DE_IA

Ao trabalhar neste repositório:
- Obedeça a todas as diretrizes listadas em `REGRAS_DO_DESENVOLVEDOR` (Clean Code, mensagens, commits, performance).
- Mantenha respostas e alterações de código modulares e focadas.
- Nunca exponha chaves de API, arquivos de autenticação de sessão ou chaves privadas/tokens de autenticação (como `LINKER_API_KEY`, tokens do WhatsApp, etc.).
