

import pathz from 'path';

export default {
  name: "fun",
  description: "Comandos de diversão e sorte",
  commands: ["aniversario", "birthday", "chance", "chaveamento", "niver", "quando", "sn", "sorte", "sorteionum"],
  usage: "{prefix}chance chover pizza",
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
    prefix,
    GRUPOS_DIR,
    optimizer,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.error.onlyGroup);

    // --- CHAVEAMENTO ---
    if (command === 'chaveamento') {
      let participantes = [];
      if (!q) return reply(MESSAGES.member.fun.chaveamentoMissingNames(prefix, command));
      
      participantes = q.split(',').map(n => n.trim()).filter(n => n);
      if (participantes.length !== 16) return reply(MESSAGES.member.fun.chaveamentoInvalidCount(participantes.length));

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
      if (!q) return reply(MESSAGES.member.fun.sorteionumUsage(prefix, command));
      const [min, max] = q.split('-').map(n => parseInt(n.trim()));
      if (isNaN(min) || isNaN(max) || min >= max) return reply(MESSAGES.member.fun.sorteionumInvalid);
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      return reply(MESSAGES.member.fun.sorteionumResult(num));
    }

    // --- ANIVERSÁRIO ---
    if (['aniversario', 'niver', 'birthday'].includes(command)) {
      const aniversariosPath = pathz.join(GRUPOS_DIR, `${from}_aniversarios.json`);
      const aniversarios = await optimizer.loadJsonWithCache(aniversariosPath, {});
      if (!q) {
        return reply(MESSAGES.member.fun.niverMenu(prefix, command));
      }

      if (q.toLowerCase() === 'lista' || q.toLowerCase() === 'list') {
        const entries = Object.entries(aniversarios);
        if (entries.length === 0) return reply(MESSAGES.member.fun.niverEmpty);
        
        let msg = `📅 *Aniversários do Grupo*\n\n`;
        entries.sort((a, b) => a[1].split('/').reverse().join('') > b[1].split('/').reverse().join('') ? 1 : -1)
          .forEach(([jid, data]) => {
            msg += `• ${data} - @${jid.split('@')[0]}\n`;
          });
        return reply(msg, { mentions: Object.keys(aniversarios) });
      }

      const dateMatch = q.match(/^([0-2][0-9]|3[01])\/(0[1-9]|1[0-2])$/);
      if (!dateMatch) return reply(MESSAGES.member.fun.niverInvalidFormat);

      aniversarios[sender] = q;
      await optimizer.saveJsonWithCache(aniversariosPath, aniversarios);
      return reply(MESSAGES.member.fun.niverSuccess(sender.split('@')[0], q), { mentions: [sender] });
    }

    const isModoBn = groupData.modobn || groupData.modobrincadeira || true;
    if (!isModoBn) return reply(MESSAGES.error.modoBnDisabled);

    // --- CHANCE ---
    if (command === 'chance') {
      if (!q) return reply(MESSAGES.member.fun.chanceMissingText(prefix));
      const chance = Math.floor(Math.random() * 101);
      const comments = [
        'As estrelas sussurraram...', 'Minha bola de cristal revelou...', 'Calculei usando matemática quântica...', 
        'Consultei os oráculos...', 'Analisei todas as possibilidades...', 'O universo me contou...'
      ];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      const evalText = chance >= 80 ? '🚀 Uau! Apostaria minhas fichas nisso!' : chance >= 60 ? '😎 Chances promissoras!' : chance >= 40 ? '🤔 Meio termo, pode rolar!' : chance >= 20 ? '😅 Hmm... complicado!' : '😂 Melhor sonhar com outra coisa!';
      return reply(MESSAGES.member.fun.chanceResult(comment, q, chance, evalText));
    }

    // --- QUANDO ---
    if (command === 'quando') {
      if (!q) return reply(MESSAGES.member.fun.quandoMissingText(prefix));
      const times = [
        'hoje à noite 🌙', 'amanhã de manhã 🌅', 'na próxima semana 📅', 'no próximo mês 🌕', 
        'no próximo ano 🎆', 'em 2025 🚀', 'quando você menos esperar ✨', 'em uma terça-feira chuvosa 🌧️',
        'depois do carnaval 🎡', 'nunca 😅', 'já aconteceu e você não viu 🤯', 'numa sexta-feira 13 😈', 'quando os santos ajudarem 😇'
      ];
      const time = times[Math.floor(Math.random() * times.length)];
      const evalText = time.includes('nunca') ? '😂 Brincadeira! Nunca desista dos seus sonhos!' : '🍀 Boa sorte na espera!';
      return reply(MESSAGES.member.fun.quandoResult(q, time, evalText));
    }

    // --- SN (Sim ou Não) ---
    if (command === 'sn') {
      if (!q) return reply(MESSAGES.member.fun.snMissingText(prefix));
      const pos = ['Sim! 🎉', 'Claro que sim! 😎', 'Com certeza! ✨', 'Pode apostar! 🎯', 'Sem dúvida! 👍', 'Obviamente! 😌', 'É isso aí! 🚀', 'Vai dar certo! 🍀'];
      const neg = ['Não! 😅', 'Nem pensar! 😂', 'Esquece! 🤭', 'Nada a ver! 🙄', 'De jeito nenhum! 😑', 'Que nada! 😒', 'Não rola! 😶', 'Melhor não! 😬'];
      const isPos = Math.random() > 0.5;
      const resp = isPos ? pos[Math.floor(Math.random() * pos.length)] : neg[Math.floor(Math.random() * neg.length)];
      const conf = Math.floor(Math.random() * 30) + 70;
      const evalText = isPos ? '🎉 O destino sorri para você!' : '😅 Mas não desista dos seus sonhos!';
      return reply(MESSAGES.member.fun.snResult(q, isPos, resp, conf, evalText));
    }

    // --- SORTE ---
    if (command === 'sorte') {
      const target = menc_os2 || sender;
      const name = menc_os2 ? getUserName(menc_os2) : pushname;
      const level = Math.floor(Math.random() * 101);
      const status = level >= 90 ? '🌟 SORTE LENDÁRIA!' : level >= 75 ? '🍀 Super sortudo!' : level >= 60 ? '✨ Boa sorte!' : level >= 40 ? '😐 Sorte mediana' : level >= 20 ? '😅 Pouca sorte' : '💀 AZAR TOTAL!';
      return reply(MESSAGES.member.fun.sorteStatus(name, level, status), { mentions: [target] });
    }
  },
};
