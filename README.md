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

### 🌟 O que é a Chainy?
A **Chainy** é um bot de WhatsApp poderoso, otimizado e modular desenvolvido em **Node.js** com suporte à sintaxe ESM nativa. Baseado no aclamado projeto [Nazuna](https://github.com/DevTokyoVx/nazuna), a Chainy traz uma série de melhorias em performance, segurança, organização de banco de dados e comandos dinâmicos, sendo a escolha ideal tanto para entretenimento (RPG robusto) quanto para a administração completa de grupos.

> [!WARNING]
> Ao migrar de bases antigas da Nazuna para a Chainy, é **altamente recomendada** uma instalação limpa para evitar conflitos nas estruturas de dados salvas.

---

## 🛠️ Funcionalidades e Módulos Principais

A Chainy é dividida em módulos estruturados para manter a organização e a facilidade de manutenção:

### ⚔️ Sistema de RPG Integrado (`src/commands/rpg/`)
Um dos RPGs mais completos do ecossistema de bots, contando com:
- **Clãs e Alianças:** Criação de clãs, convites, gerenciamento e ranking de clãs.
- **Pets & Combate:** Capture, treine, upe e aposte em batalhas de pets, além de duelos PVP.
- **Economia Dinâmica:** Sistema de compras, prestígio, mercado entre jogadores, leilão e cassino completo.
- **Dungeons & Quests:** Explore masmorras perigosas, complete missões diárias e evolua suas skills.
- **Social & Família:** Sistema de relacionamentos, casamentos, divórcios, adoção de filhos e compra de casas/propriedades.

### 🛡️ Administração de Grupos (`src/commands/admin/`)
Controle total do seu grupo na ponta dos dedos:
- **Segurança Avançada:** Whitelist, detecção de spam, proteção contra links nocivos e invasões.
- **Moderação:** Banimentos temporários ou permanentes, advertências, mute, rebaixamento e promoção de cargos.
- **Automação:** Mensagens automáticas, controle de horários (abertura/fechamento automático de grupo) e regras dinâmicas.

### 👤 Membros e Utilitários (`src/commands/member/`)
Interação e ferramentas para o dia a dia dos usuários:
- **Ferramentas Úteis:** Calculadora, previsão do clima, encurtador de links, consulta à Wikipedia e notícias em tempo real.
- **Jogos em Grupo:** Stop, caça-palavras, anagrama, forca, wordle e quiz interativo.
- **Edição de Mídias:** Conversor de figurinhas (stickers) completo, aplicação de efeitos de áudio e vídeo avançados.

### ⚙️ Painel de Dono (`src/commands/owner/`)
Configuração e controle geral do ecossistema:
- **Gestão de Subdonos:** Delegação de permissões de administrador global do bot.
- **Blacklist Global:** Bloqueio de usuários nocivos em todos os grupos onde o bot atua.
- **Atualização Dinâmica:** Atualização do bot em tempo real via git com painel de progresso editado em mensagem única.

---

## 📋 Pré-requisitos do Sistema

| Requisito | Mínimo | Recomendado |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | `LTS` |
| **RAM** | `256 MB` | `1 GB` |
| **Disco Livre** | `256 MB` | `1 GB` (para cache de mídias) |
| **Sistema Operacional** | Windows, Linux, macOS ou Android (Termux) | Linux (VPS) |
| **Dependências Externas** | FFmpeg (para mídias), Git | FFmpeg, Git, Yarn |

---

## 🚀 Como Instalar e Configurar

A Chainy acompanha um assistente interativo que facilita a instalação de dependências e a configuração básica do bot.

### Passo 1. Clonar o Repositório
```bash
git clone https://github.com/L1ghtzin/chainy.git
cd chainy
```

### Passo 2. Executar o Assistente de Configuração
Execute o comando abaixo e insira o nome do dono, o número de telefone correspondente, o nome do bot e o prefixo desejado:
```bash
npm run config
```
*(Opcional: Você pode optar por deixar o assistente instalar todas as dependências automaticamente no final da configuração).*

### Passo 3. Instalar Dependências Manualmente (se não feito no Passo 2)
```bash
npm run config:install
```

### Passo 4. Iniciar o Bot
```bash
npm start
```
Após o início, escaneie o QR Code que aparecerá no terminal ou utilize o código de pareamento digitando seu número de telefone quando solicitado.

---

## 🔌 Opções de Conexão

* **Opção 1: QR Code (Padrão):** Abra o WhatsApp > Aparelhos conectados > Conectar um aparelho, e escaneie o código QR gerado diretamente no console.
* **Opção 2: Código de Pareamento:** Caso seu terminal não suporte caracteres especiais para renderização de QR Code, selecione a opção de pareamento informando o número do telefone com código do país e DDD (ex: `5511999999999`). Digite o código de 8 dígitos gerado no seu aplicativo do WhatsApp.

---

## 🔄 Mantendo o Bot Atualizado

Para atualizar seu bot sem perder suas configurações locais e dados salvos, utilize o comando integrado:
```bash
npm run update
```
Esse comando roda o script de atualização seguro que faz o backup de arquivos cruciais, puxa a última versão do GitHub, limpa caches obsoletos, reconstrói dependências e reinicia o bot de forma totalmente automatizada. No chat, o dono pode enviar o comando `/atualizar sim` para acompanhar o status dinâmico etapa por etapa em uma mensagem única.

---

## ❓ Perguntas Frequentes (FAQ)

<details>
<summary><b>Como definir outro prefixo para o bot?</b></summary>
Você pode reconfigurar o prefixo a qualquer momento rodando novamente o comando <code>npm run config</code> no terminal ou editando diretamente o arquivo <code>dados/config.json</code>.
</details>

<details>
<summary><b>O que fazer se o QR Code quebrar no terminal?</b></summary>
Aumente a largura da janela do terminal e diminua o zoom para que os blocos de caracteres fiquem alinhados. Se mesmo assim não funcionar, utilize a conexão via código de pareamento.
</details>

<details>
<summary><b>Como resolver o erro "FFmpeg não encontrado"?</b></summary>
Certifique-se de que o FFmpeg está instalado em seu sistema operacional e configurado no PATH do sistema. O assistente de configuração (<code>npm run config</code>) tenta instalá-lo de forma automatizada na maioria das plataformas.
</details>

---

## 👤 Créditos e Licenciamento

- **Projeto Base:** [Nazuna](https://github.com/DevTokyoVx/nazuna) criado originalmente por **Hiudy** e mantido por **DevTokyoVx**.
- **Desenvolvimento Chainy:** Personalizações, correções de bugs, sistema de atualização dinâmica e otimizações por **L1ghtzin**.

> **© 2025/2026 Hiudy & L1ghtzin — Todos os direitos reservados.**  
> Este software é de código aberto e gratuito. A comercialização do mesmo é **estritamente proibida**.
