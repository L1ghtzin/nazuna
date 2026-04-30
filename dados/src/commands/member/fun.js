import { PREFIX } from "../../config.js";

export default {
  name: "fun",
  description: "Comandos de diversão e sorte",
  commands: ["aniversario", "birthday", "chance", "chaveamento", "niver", "quando", "sn", "sorte", "sorteionum"],
  usage: `${PREFIX}chance chover pizza`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    pushname, 
    command, 
    args, 
    menc_os2, 
    getUserName, 
    q,
    from,
    GRUPOS_DIR,
    MESSAGES
  }) => {
    if (!isGroup) return reply("🎮 Ops! Esse comando só funciona em grupos!");

    // --- CHAVEAMENTO ---
    if (command === 'chaveamento') {
      let participantes = [];
      if (!q) return reply(`💔 Forneça exatamente 16 nomes! Exemplo: ${PREFIX}${command} nome1,nome2,...,nome16`);
      
      participantes = q.split(',').map(n => n.trim()).filter(n => n);
      if (participantes.length !== 16) return reply(`💔 Forneça exatamente 16 nomes! Você forneceu ${participantes.length}.`);

      participantes.sort(() => Math.random() - 0.5);
      const g1 = participantes.slice(0, 8);
      const g2 = participantes.slice(8, 16);
      
      let msg = `🏆 *Chaveamento do Torneio* 🏆\n\n📌 *Grupo 1*\n`;
      g1.forEach((p, i) => msg += `  ${i + 1}. ${p}\n`);
      msg += `\n📌 *Grupo 2*\n`;
      g2.forEach((p, i) => msg += `  ${i + 1}. ${p}\n`);
      
      return reply(msg);
    }

    // --- SORTEIO NUMERO ---
    if (command === 'sorteionum' || command === 'gerarnumero') {
      if (!q) return reply(`💡 Uso: ${PREFIX}${command} 1-50`);
      const [min, max] = q.split('-').map(n => parseInt(n.trim()));
      if (isNaN(min) || isNaN(max) || min >= max) return reply(`💔 Intervalo inválido!`);
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      return reply(`🎲 *Sorteio:* *${num}*`);
    }

    // --- ANIVERSÁRIO ---
    if (['aniversario', 'niver', 'birthday'].includes(command)) {
      const fs = await import('fs');
      const path = await import('path');
      const aniversariosPath = path.join(GRUPOS_DIR, `${from}_aniversarios.json`);
      let aniversarios = {};
      try {
        if (fs.existsSync(aniversariosPath)) {
          aniversarios = JSON.parse(fs.readFileSync(aniversariosPath, 'utf-8'));
        }
      } catch (e) { aniversarios = {}; }

      if (!q) {
        let msg = `🎂 *Sistema de Aniversários*\n\n`;
        msg += `📅 Use: ${PREFIX}${command} DD/MM\n`;
        msg += `👥 Use: ${PREFIX}${command} lista\n`;
        msg += `✨ O bot parabeniza automaticamente os aniversariantes do dia!`;
        return reply(msg);
      }

      if (q.toLowerCase() === 'lista' || q.toLowerCase() === 'list') {
        const entries = Object.entries(aniversarios);
        if (entries.length === 0) return reply("📭 Nenhum aniversário registrado neste grupo.");
        
        let msg = `📅 *Aniversários do Grupo*\n\n`;
        entries.sort((a, b) => a[1].split('/').reverse().join('') > b[1].split('/').reverse().join('') ? 1 : -1)
          .forEach(([jid, data]) => {
            msg += `• ${data} - @${jid.split('@')[0]}\n`;
          });
        return reply(msg, { mentions: Object.keys(aniversarios) });
      }

      const dateMatch = q.match(/^([0-2][0-9]|3[01])\/(0[1-9]|1[0-2])$/);
      if (!dateMatch) return reply(`💔 Formato inválido! Use DD/MM (ex: 25/12).`);

      aniversarios[sender] = q;
      fs.writeFileSync(aniversariosPath, JSON.stringify(aniversarios, null, 2));
      return reply(`✅ @${sender.split('@')[0]}, seu aniversário foi registrado para o dia ${q}! 🥳`, { mentions: [sender] });
    }

    const isModoBn = groupData.modobn || groupData.modobrincadeira || true;
    if (!isModoBn) return reply(`💔 O modo brincadeira está desativado nesse grupo!`);

    // --- CHANCE ---
    if (command === 'chance') {
      if (!q) return reply(`🎲 Me conta algo para eu calcular as chances! 📊\n\n📝 *Exemplo:* ${PREFIX}chance chover pizza hoje`);
      const chance = Math.floor(Math.random() * 101);
      const comments = [
        'As estrelas sussurraram...', 'Minha bola de cristal revelou...', 'Calculei usando matemática quântica...', 
        'Consultei os oráculos...', 'Analisei todas as possibilidades...', 'O universo me contou...'
      ];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      return reply(`🎯 *${comment}*\n\n🎯 A chance de "${q}" acontecer é: *${chance}%*!\n\n${chance >= 80 ? '🚀 Uau! Apostaria minhas fichas nisso!' : chance >= 60 ? '😎 Chances promissoras!' : chance >= 40 ? '🤔 Meio termo, pode rolar!' : chance >= 20 ? '😅 Hmm... complicado!' : '😂 Melhor sonhar com outra coisa!'}`);
    }

    // --- QUANDO ---
    if (command === 'quando') {
      if (!q) return reply(`🔮 Me conta o que você quer que eu preveja! 🌠\n\n📝 *Exemplo:* ${PREFIX}quando vou ficar rico`);
      const times = [
        'hoje à noite 🌙', 'amanhã de manhã 🌅', 'na próxima semana 📅', 'no próximo mês 🌕', 
        'no próximo ano 🎆', 'em 2025 🚀', 'quando você menos esperar ✨', 'em uma terça-feira chuvosa 🌧️',
        'depois do carnaval 🎡', 'nunca 😅', 'já aconteceu e você não viu 🤯', 'numa sexta-feira 13 😈', 'quando os santos ajudarem 😇'
      ];
      const time = times[Math.floor(Math.random() * times.length)];
      return reply(`🔮 Minha visão revela que...\n\n  ️ "${q}" vai acontecer: *${time}*!\n\n${time.includes('nunca') ? '😂 Brincadeira! Nunca desista dos seus sonhos!' : '🍀 Boa sorte na espera!'}`);
    }

    // --- SN (Sim ou Não) ---
    if (command === 'sn') {
      if (!q) return reply(`🎱 Faça uma pergunta para o oráculo! 🔮\n\n📝 *Exemplo:* ${PREFIX}sn Vou ganhar na loteria?`);
      const pos = ['Sim! 🎉', 'Claro que sim! 😎', 'Com certeza! ✨', 'Pode apostar! 🎯', 'Sem dúvida! 👍', 'Obviamente! 😌', 'É isso aí! 🚀', 'Vai dar certo! 🍀'];
      const neg = ['Não! 😅', 'Nem pensar! 😂', 'Esquece! 🤭', 'Nada a ver! 🙄', 'De jeito nenhum! 😑', 'Que nada! 😒', 'Não rola! 😶', 'Melhor não! 😬'];
      const isPos = Math.random() > 0.5;
      const resp = isPos ? pos[Math.floor(Math.random() * pos.length)] : neg[Math.floor(Math.random() * neg.length)];
      return reply(`  **ORÁCULO RESPONDE** 🎱\n\n🤔 *Pergunta:* "${q}"\n\n${isPos ? '🎆' : '💔'} **Resposta:** *${resp}*\n\n📊 *Confiança:* ${Math.floor(Math.random() * 30) + 70}%\n\n${isPos ? '🎉 O destino sorri para você!' : '😅 Mas não desista dos seus sonhos!'}`);
    }

    // --- SORTE ---
    if (command === 'sorte') {
      const target = menc_os2 || sender;
      const name = menc_os2 ? getUserName(menc_os2) : pushname;
      const level = Math.floor(Math.random() * 101);
      const status = level >= 90 ? '🌟 SORTE LENDÁRIA!' : level >= 75 ? '🍀 Super sortudo!' : level >= 60 ? '✨ Boa sorte!' : level >= 40 ? '😐 Sorte mediana' : level >= 20 ? '😅 Pouca sorte' : '💀 AZAR TOTAL!';
      return reply(`🍀 *TESTE DE SORTE* 🍀\n\n👤 *Usuário:* ${name}\n📊 *Nível de Sorte:* ${level}%\n\n📝 *Status:* ${status}\n\n${level >= 50 ? '🚀 Aproveite o dia, a sorte está com você!' : '⚠️ Melhor ter cuidado hoje!'}`, { mentions: [target] });
    }
  },
};
