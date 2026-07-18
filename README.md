# 🤖 CHAINY BOT — WHATSAPP

<div align="center">
  <img src="https://files.catbox.moe/1p22ef.png" alt="Chainy Banner" width="100%">
  <br><br>
  
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
  [![License](https://img.shields.io/badge/license-ISC-blue.svg?style=for-the-badge)](LICENSE)
  [![Base](https://img.shields.io/badge/base-Nazuna-purple.svg?style=for-the-badge)](https://github.com/DevTokyoVx/nazuna)
  [![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)]()
</div>

---

## 📌 Índice
- [🌟 Sobre a Chainy](#-sobre-a-chainy)
- [📂 Estrutura do Projeto](#-estrutura-do-projeto)
- [🛠️ Recursos & Módulos Principais](#️-recursos--módulos-principais)
  - [⚔️ RPG Integrado](#️-rpg-integrado)
  - [🛡️ Administração](#️-administração)
  - [👤 Membros & Utilitários](#-membros--utilitários)
  - [⚙️ Painel do Dono](#️-painel-do-dono)
- [📋 Pré-requisitos](#-pré-requisitos)
- [🚀 Instalação e Inicialização](#-instalação-e-inicialização)
- [🔌 Métodos de Conexão](#-métodos-de-conexão)
- [🔄 Atualização Automática](#-atualização-automática)
- [❓ Perguntas Frequentes (FAQ)](#-perguntas-frequentes-faq)
- [👤 Créditos e Licenciamento](#-créditos-e-licenciamento)

---

## 🌟 Sobre a Chainy

A **Chainy** é um framework modular de bot para WhatsApp desenvolvido em **Node.js** com suporte nativo à sintaxe ESM. Baseado no ecossistema da [Nazuna](https://github.com/DevTokyoVx/nazuna), a Chainy introduz melhorias significativas em performance, segurança, tratamento de concorrência na persistência de dados JSON e gerenciamento automatizado de comandos dinâmicos.

É a escolha ideal tanto para entretenimento (através de um sistema completo de RPG) quanto para moderação profissional de grupos.

> [!WARNING]
> Ao migrar de bases antigas da Nazuna para a Chainy, é **altamente recomendada** uma instalação limpa para evitar conflitos nas estruturas de dados salvas.

---

## 📂 Estrutura do Projeto

A arquitetura do bot é estruturada de forma altamente modular para simplificar a adição de novas funcionalidades e manter a separação de responsabilidades (Clean Code / MVC):

```text
chainy/
├── dados/                       # Armazenamento e persistência de dados
│   ├── database/                # Cache em memória e arquivos JSON do banco
│   │   ├── grupos/              # Configurações de segurança e status de cada grupo
│   │   ├── dono/                # Credenciais, configurações globais e blacklist
│   │   ├── backups/             # Backups automáticos gerados pelo saveJsonFileSafe()
│   │   ├── qr-code/             # Credenciais de sessão do WhatsApp (Baileys)
│   │   └── tmp/                 # Arquivos temporários (mídias, cache de processamento)
│   └── config.json              # Configuração básica do bot (Dono, Prefixo, etc.)
├── src/                         # Código-fonte principal do bot
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
│   │   └── messages/            # Mensagens centralizadas por domínio (admin, member, owner, rpg, etc)
│   ├── workers/                 # Jobs agendados (cron) e workers em background
│   └── .scripts/                # Scripts npm (start, config, update)
└── package.json                 # Manifesto do projeto e scripts npm
```

---

## 🛠️ Recursos & Módulos Principais

### ⚔️ RPG Integrado (`src/commands/rpg/`)
Um ecossistema de RPG interativo e completo diretamente no WhatsApp:
- **Clãs e Alianças:** Crie clãs, recrute membros, gerencie permissões e suba no ranking global.
- **Pets & Duelos:** Capture e treine pets, dispute duelos em turnos PVP e faça apostas nas batalhas.
- **Economia Dinâmica:** Sistema de inventário, mercado livre entre jogadores, leilões em tempo real e jogos de cassino.
- **Dungeons & Quests:** Explore masmorras, derrote bosses, complete missões diárias e evolua suas habilidades.
- **Social & Vida Virtual:** Compre propriedades, case-se com outros usuários, adote filhos virtuais e acúmule prestígio.

### 🛡️ Administração (`src/commands/admin/`)
Controle total do grupo com segurança automática robusta:
- **Segurança Antinvasão:** Whitelist de usuários, detecção de spam e proteção contra links externos/nocivos.
- **Moderação Inteligente:** Aplicação de advertências (warnings), banimentos temporários/permanentes e mutar membros.
- **Automação de Horários:** Configuração para abrir e fechar grupos automaticamente em horários agendados.

### 👤 Membros & Utilitários (`src/commands/member/`)
Ferramentas úteis para engajamento e facilidade no dia a dia:
- **Ferramentas Práticas:** Tradutor, calculadora, previsão do clima, encurtador de links e pesquisas rápidas.
- **Minijogos Coletivos:** Desafios de Stop, Forca, Caça-Palavras, Anagramas e Quizzes com pontuação.
- **Manipulação de Mídias:** Conversor avançado de figurinhas (stickers normais e animados), aplicação de filtros em imagens, áudios e vídeos.

### ⚙️ Painel do Dono (`src/commands/owner/`)
Gestão central do ecossistema e manutenção do bot:
- **Gestão de Subdonos:** Adicione ou remova permissões de administradores globais do bot.
- **Blacklist Global:** Bloqueie usuários maliciosos simultaneamente de todos os grupos do bot.
- **Painel Dinâmico:** Gerencie configurações gerais em tempo real de forma interativa.

---

## 📋 Pré-requisitos

| Requisito | Mínimo | Recomendado |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | `LTS` (Long Term Support) |
| **RAM** | `256 MB` | `1 GB` |
| **Armazenamento** | `256 MB` | `1 GB` (ideal para logs e mídias cacheadas) |
| **Sistema Operacional** | Windows, Linux, macOS ou Termux | Linux (VPS dedicada) |
| **Dependências Externas** | FFmpeg (configurado no PATH), Git | FFmpeg, Git, Yarn/NPM |

---

## 🚀 Instalação e Inicialização

A Chainy acompanha um assistente interativo no terminal para simplificar a configuração de credenciais iniciais.

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/L1ghtzin/chainy.git
cd chainy
```

### Passo 2: Configuração Inicial
Execute o assistente interativo para definir as variáveis essenciais do bot (Nome do Bot, Prefixo, Número do Dono, etc.):
```bash
npm run config
```
*(Nota: No final da configuração, o assistente perguntará se deseja que ele instale todas as dependências do projeto de forma automatizada).*

### Passo 3: Instalar Dependências (Manualmente, se necessário)
Se optar por não instalar as dependências durante o Passo 2, execute:
```bash
npm run config:install
```

### Passo 4: Iniciar o Bot
```bash
npm start
```

---

## 🔌 Métodos de Conexão

Após iniciar o bot no terminal, você poderá conectá-lo ao WhatsApp usando dois métodos:

* **Opção 1: QR Code (Padrão)**
  Abra o WhatsApp no celular > toque em **Aparelhos conectados** > **Conectar um aparelho** e aponte a câmera para escanear o código QR gerado no terminal.
  
* **Opção 2: Código de Pareamento**
  Útil caso seu terminal (ex: VPS sem renderização unicode completa) quebre o visual do QR Code. Informe o número do telefone com código de país e DDD quando solicitado no terminal (ex: `5511999999999`) e digite o código de 8 dígitos gerado no app do WhatsApp.

---

## 🔄 Atualização Automática

Para manter seu bot atualizado sem perder as suas configurações locais ou arquivos de banco de dados (`dados/database/*`), utilize o comando integrado de atualização segura:

```bash
npm run update
```

**O que este script faz:**
1. Realiza backup de arquivos vitais de banco de dados e chaves de sessão.
2. Efetua o pull das alterações mais recentes do repositório de forma limpa.
3. Remove arquivos temporários obsoletos e reconstrói as dependências do NPM.
4. Reinicia o processo do bot de forma automatizada.

> [!TIP]
> O dono do bot também pode iniciar e monitorar o progresso dessa atualização diretamente no WhatsApp enviando o comando `/atualizar sim`.

---

## ❓ Perguntas Frequentes (FAQ)

<details>
<summary><b>Como reconfigurar o prefixo ou número de dono?</b></summary>
Você pode rodar novamente o assistente via <code>npm run config</code> ou alterar os valores editando diretamente o arquivo <code>dados/config.json</code>.
</details>

<details>
<summary><b>O QR Code no terminal está desalinhado/quebrado, o que fazer?</b></summary>
Aumente o tamanho da janela do console e diminua o zoom para ajustar os blocos. Se o problema persistir, opte pela conexão via Código de Pareamento inserindo seu número diretamente no terminal.
</details>

<details>
<summary><b>Como resolver erros relativos ao "FFmpeg"?</b></summary>
Certifique-se de que o executável do FFmpeg está instalado e adicionado às Variáveis de Ambiente (PATH) do seu sistema operacional. O assistente de configuração (<code>npm run config</code>) tentará instalá-lo de forma automatizada na maioria das distribuições.
</details>

---

## 👤 Créditos e Licenciamento

- **Projeto Base:** [Nazuna](https://github.com/DevTokyoVx/nazuna) desenvolvido originalmente por **Hiudy** e mantido por **DevTokyoVx**.
- **Desenvolvimento Chainy:** Personalizações de layout, correções de concorrência, otimizações e scripts de atualização automática por **L1ghtzin**.

> **© 2025/2026 Hiudy & L1ghtzin — Todos os direitos reservados.**  
> Este software é de código aberto e livre para uso pessoal. A venda ou comercialização deste código é **estritamente proibida**.
