async function menubn(prefix, botName = "MeuBot", userName = "Usuário", isLiteMode = false) {
  let menuContent = `
╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, *${userName}*!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *JOGOS*
┊
┊•.̇𖥨֗🍓⭟${prefix}jogodavelha
┊•.̇𖥨֗🍓⭟${prefix}eununca
┊•.̇𖥨֗🍓⭟${prefix}vab
┊•.̇𖥨֗🍓⭟${prefix}chance
┊•.̇𖥨֗🍓⭟${prefix}quando
┊•.̇𖥨֗🍓⭟${prefix}casal
┊•.̇𖥨֗🍓⭟${prefix}shipo
┊•.̇𖥨֗🍓⭟${prefix}sn
┊•.̇𖥨֗🍓⭟${prefix}ppt${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}suicidio` : ''}
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *INTERAÇÕES*
┊
┊•.̇𖥨֗🍓⭟${prefix}chute
┊•.̇𖥨֗🍓⭟${prefix}chutar
┊•.̇𖥨֗🍓⭟${prefix}tapa
┊•.̇𖥨֗🍓⭟${prefix}soco
┊•.̇𖥨֗🍓⭟${prefix}socar
┊•.̇𖥨֗🍓⭟${prefix}explodir
┊•.̇𖥨֗🍓⭟${prefix}abraco
┊•.̇𖥨֗🍓⭟${prefix}abracar
┊•.̇𖥨֗🍓⭟${prefix}morder
┊•.̇𖥨֗🍓⭟${prefix}mordida
┊•.̇𖥨֗🍓⭟${prefix}lamber
┊•.̇𖥨֗🍓⭟${prefix}lambida
┊•.̇𖥨֗🍓⭟${prefix}beijo
┊•.̇𖥨֗🍓⭟${prefix}beijar
┊•.̇𖥨֗🍓⭟${prefix}mata
┊•.̇𖥨֗🍓⭟${prefix}matar
┊•.̇𖥨֗🍓⭟${prefix}cafune
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;

  if (!isLiteMode) {
    menuContent += `
╭┈❪🍧ฺꕸ▸ *INTERAÇÕES "HOT"*
┊
┊•.̇𖥨֗🍓⭟${prefix}surubao
┊•.̇𖥨֗🍓⭟${prefix}sexo
┊•.̇𖥨֗🍓⭟${prefix}beijob
┊•.̇𖥨֗🍓⭟${prefix}beijarb
┊•.̇𖥨֗🍓⭟${prefix}tapar
┊•.̇𖥨֗🍓⭟${prefix}goza
┊•.̇𖥨֗🍓⭟${prefix}gozar
┊•.̇𖥨֗🍓⭟${prefix}mamar
┊•.̇𖥨֗🍓⭟${prefix}mamada
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;
  }

  menuContent += `
╭┈❪🍧ฺꕸ▸ *BRINCADEIRAS - M*
┊${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}gay` : ''}
┊•.̇𖥨֗🍓⭟${prefix}burro
┊•.̇𖥨֗🍓⭟${prefix}inteligente
┊•.̇𖥨֗🍓⭟${prefix}otaku
┊•.̇𖥨֗🍓⭟${prefix}fiel
┊•.̇𖥨֗🍓⭟${prefix}infiel${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}corno` : ''}
┊•.̇𖥨֗🍓⭟${prefix}gado
┊•.̇𖥨֗🍓⭟${prefix}gostoso
┊•.̇𖥨֗🍓⭟${prefix}feio
┊•.̇𖥨֗🍓⭟${prefix}rico
┊•.̇𖥨֗🍓⭟${prefix}pobre${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}pirocudo` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}nazista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}ladrao` : ''}
┊•.̇𖥨֗🍓⭟${prefix}safado
┊•.̇𖥨֗🍓⭟${prefix}vesgo
┊•.̇𖥨֗🍓⭟${prefix}bebado${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}machista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}homofobico` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}racista` : ''}
┊•.̇𖥨֗🍓⭟${prefix}chato
┊•.̇𖥨֗🍓⭟${prefix}sortudo
┊•.̇𖥨֗🍓⭟${prefix}azarado
┊•.̇𖥨֗🍓⭟${prefix}forte
┊•.̇𖥨֗🍓⭟${prefix}fraco
┊•.̇𖥨֗🍓⭟${prefix}pegador
┊•.̇𖥨֗🍓⭟${prefix}otario
┊•.̇𖥨֗🍓⭟${prefix}macho
┊•.̇𖥨֗🍓⭟${prefix}bobo
┊•.̇𖥨֗🍓⭟${prefix}nerd
┊•.̇𖥨֗🍓⭟${prefix}preguicoso
┊•.̇𖥨֗🍓⭟${prefix}trabalhador
┊•.̇𖥨֗🍓⭟${prefix}brabo
┊•.̇𖥨֗🍓⭟${prefix}lindo
┊•.̇𖥨֗🍓⭟${prefix}malandro
┊•.̇𖥨֗🍓⭟${prefix}simpatico
┊•.̇𖥨֗🍓⭟${prefix}engracado
┊•.̇𖥨֗🍓⭟${prefix}charmoso
┊•.̇𖥨֗🍓⭟${prefix}misterioso
┊•.̇𖥨֗🍓⭟${prefix}carinhoso
┊•.̇𖥨֗🍓⭟${prefix}desumilde
┊•.̇𖥨֗🍓⭟${prefix}humilde
┊•.̇𖥨֗🍓⭟${prefix}ciumento
┊•.̇𖥨֗🍓⭟${prefix}corajoso
┊•.̇𖥨֗🍓⭟${prefix}covarde
┊•.̇𖥨֗🍓⭟${prefix}esperto${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}talarico` : ''}
┊•.̇𖥨֗🍓⭟${prefix}chorao
┊•.̇𖥨֗🍓⭟${prefix}brincalhao${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}bolsonarista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}petista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}comunista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}lulista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}traidor` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}bandido` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}cachorro` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}vagabundo` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}pilantra` : ''}
┊•.̇𖥨֗🍓⭟${prefix}mito
┊•.̇𖥨֗🍓⭟${prefix}padrao
┊•.̇𖥨֗🍓⭟${prefix}comedia${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}psicopata` : ''}
┊•.̇𖥨֗🍓⭟${prefix}fortao
┊•.̇𖥨֗🍓⭟${prefix}magrelo
┊•.̇𖥨֗🍓⭟${prefix}bombado
┊•.̇𖥨֗🍓⭟${prefix}chefe
┊•.̇𖥨֗🍓⭟${prefix}presidente
┊•.̇𖥨֗🍓⭟${prefix}rei
┊•.̇𖥨֗🍓⭟${prefix}patrao
┊•.̇𖥨֗🍓⭟${prefix}playboy
┊•.̇𖥨֗🍓⭟${prefix}zueiro
┊•.̇𖥨֗🍓⭟${prefix}gamer
┊•.̇𖥨֗🍓⭟${prefix}programador
┊•.̇𖥨֗🍓⭟${prefix}visionario
┊•.̇𖥨֗🍓⭟${prefix}billionario
┊•.̇𖥨֗🍓⭟${prefix}poderoso
┊•.̇𖥨֗🍓⭟${prefix}vencedor
┊•.̇𖥨֗🍓⭟${prefix}senhor
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *BRINCADEIRAS - F*
┊${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}lésbica` : ''}
┊•.̇𖥨֗🍓⭟${prefix}burra
┊•.̇𖥨֗🍓⭟${prefix}inteligente
┊•.̇𖥨֗🍓⭟${prefix}otaku
┊•.̇𖥨֗🍓⭟${prefix}fiel
┊•.̇𖥨֗🍓⭟${prefix}infiel${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}corna` : ''}
┊•.̇𖥨֗🍓⭟${prefix}gada
┊•.̇𖥨֗🍓⭟${prefix}gostosa
┊•.̇𖥨֗🍓⭟${prefix}feia
┊•.̇𖥨֗🍓⭟${prefix}rica
┊•.̇𖥨֗🍓⭟${prefix}pobre${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}bucetuda` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}nazista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}ladra` : ''}
┊•.̇𖥨֗🍓⭟${prefix}safada
┊•.̇𖥨֗🍓⭟${prefix}vesga
┊•.̇𖥨֗🍓⭟${prefix}bêbada${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}machista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}homofóbica` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}racista` : ''}
┊•.̇𖥨֗🍓⭟${prefix}chata
┊•.̇𖥨֗🍓⭟${prefix}sortuda
┊•.̇𖥨֗🍓⭟${prefix}azarada
┊•.̇𖥨֗🍓⭟${prefix}forte
┊•.̇𖥨֗🍓⭟${prefix}fraca
┊•.̇𖥨֗🍓⭟${prefix}pegadora
┊•.̇𖥨֗🍓⭟${prefix}otária
┊•.̇𖥨֗🍓⭟${prefix}boba
┊•.̇𖥨֗🍓⭟${prefix}nerd
┊•.̇𖥨֗🍓⭟${prefix}preguiçosa
┊•.̇𖥨֗🍓⭟${prefix}trabalhadora
┊•.̇𖥨֗🍓⭟${prefix}braba
┊•.̇𖥨֗🍓⭟${prefix}linda
┊•.̇𖥨֗🍓⭟${prefix}malandra
┊•.̇𖥨֗🍓⭟${prefix}simpática
┊•.̇𖥨֗🍓⭟${prefix}engraçada
┊•.̇𖥨֗🍓⭟${prefix}charmosa
┊•.̇𖥨֗🍓⭟${prefix}misteriosa
┊•.̇𖥨֗🍓⭟${prefix}carinhosa
┊•.̇𖥨֗🍓⭟${prefix}desumilde
┊•.̇𖥨֗🍓⭟${prefix}humilde
┊•.̇𖥨֗🍓⭟${prefix}ciumenta
┊•.̇𖥨֗🍓⭟${prefix}corajosa
┊•.̇𖥨֗🍓⭟${prefix}covarde
┊•.̇𖥨֗🍓⭟${prefix}esperta${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}talarica` : ''}
┊•.̇𖥨֗🍓⭟${prefix}chorona
┊•.̇𖥨֗🍓⭟${prefix}brincalhona${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}bolsonarista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}petista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}comunista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}lulista` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}traidora` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}bandida` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}cachorra` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}vagabunda` : ''}${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}pilantra` : ''}
┊•.̇𖥨֗🍓⭟${prefix}mito
┊•.̇𖥨֗🍓⭟${prefix}padrão
┊•.̇𖥨֗🍓⭟${prefix}comédia${!isLiteMode ? `\n┊•.̇𖥨֗🍓⭟${prefix}psicopata` : ''}
┊•.̇𖥨֗🍓⭟${prefix}fortona
┊•.̇𖥨֗🍓⭟${prefix}magrela
┊•.̇𖥨֗🍓⭟${prefix}bombada
┊•.̇𖥨֗🍓⭟${prefix}chefe
┊•.̇𖥨֗🍓⭟${prefix}presidenta
┊•.̇𖥨֗🍓⭟${prefix}rainha
┊•.̇𖥨֗🍓⭟${prefix}patroa
┊•.̇𖥨֗🍓⭟${prefix}playgirl
┊•.̇𖥨֗🍓⭟${prefix}zueira
┊•.̇𖥨֗🍓⭟${prefix}gamer
┊•.̇𖥨֗🍓⭟${prefix}programadora
┊•.̇𖥨֗🍓⭟${prefix}visionária
┊•.̇𖥨֗🍓⭟${prefix}bilionária
┊•.̇𖥨֗🍓⭟${prefix}poderosa
┊•.̇𖥨֗🍓⭟${prefix}vencedora
┊•.̇𖥨֗🍓⭟${prefix}senhora
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;

  if (!isLiteMode) {
    menuContent += `
╭┈❪🍧ฺꕸ▸ *RANKS - M*
┊
┊•.̇𖥨֗🍓⭟${prefix}rankgay
┊•.̇𖥨֗🍓⭟${prefix}rankburro
┊•.̇𖥨֗🍓⭟${prefix}rankinteligente
┊•.̇𖥨֗🍓⭟${prefix}rankotaku
┊•.̇𖥨֗🍓⭟${prefix}rankfiel
┊•.̇𖥨֗🍓⭟${prefix}rankinfiel
┊•.̇𖥨֗🍓⭟${prefix}rankcorno
┊•.̇𖥨֗🍓⭟${prefix}rankgado
┊•.̇𖥨֗🍓⭟${prefix}rankgostoso
┊•.̇𖥨֗🍓⭟${prefix}rankrico
┊•.̇𖥨֗🍓⭟${prefix}rankpobre
┊•.̇𖥨֗🍓⭟${prefix}rankforte
┊•.̇𖥨֗🍓⭟${prefix}rankpegador
┊•.̇𖥨֗🍓⭟${prefix}rankmacho
┊•.̇𖥨֗🍓⭟${prefix}ranknerd
┊•.̇𖥨֗🍓⭟${prefix}ranktrabalhador
┊•.̇𖥨֗🍓⭟${prefix}rankbrabo
┊•.̇𖥨֗🍓⭟${prefix}ranklindo
┊•.̇𖥨֗🍓⭟${prefix}rankmalandro
┊•.̇𖥨֗🍓⭟${prefix}rankengracado
┊•.̇𖥨֗🍓⭟${prefix}rankcharmoso
┊•.̇𖥨֗🍓⭟${prefix}rankvisionario
┊•.̇𖥨֗🍓⭟${prefix}rankpoderoso
┊•.̇𖥨֗🍓⭟${prefix}rankvencedor
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *RANKS - F*
┊
┊•.̇𖥨֗🍓⭟${prefix}ranklesbica
┊•.̇𖥨֗🍓⭟${prefix}rankburra
┊•.̇𖥨֗🍓⭟${prefix}rankinteligente
┊•.̇𖥨֗🍓⭟${prefix}rankotaku
┊•.̇𖥨֗🍓⭟${prefix}rankfiel
┊•.̇𖥨֗🍓⭟${prefix}rankinfiel
┊•.̇𖥨֗🍓⭟${prefix}rankcorna
┊•.̇𖥨֗🍓⭟${prefix}rankgada
┊•.̇𖥨֗🍓⭟${prefix}rankgostosa
┊•.̇𖥨֗🍓⭟${prefix}rankrica
┊•.̇𖥨֗🍓⭟${prefix}rankpobre
┊•.̇𖥨֗🍓⭟${prefix}rankforte
┊•.̇𖥨֗🍓⭟${prefix}rankpegadora
┊•.̇𖥨֗🍓⭟${prefix}ranknerd
┊•.̇𖥨֗🍓⭟${prefix}ranktrabalhadora
┊•.̇𖥨֗🍓⭟${prefix}rankbraba
┊•.̇𖥨֗🍓⭟${prefix}ranklinda
┊•.̇𖥨֗🍓⭟${prefix}rankmalandra
┊•.̇𖥨֗🍓⭟${prefix}rankengracada
┊•.̇𖥨֗🍓⭟${prefix}rankcharmosa
┊•.̇𖥨֗🍓⭟${prefix}rankvisionaria
┊•.̇𖥨֗🍓⭟${prefix}rankpoderosa
┊•.̇𖥨֗🍓⭟${prefix}rankvencedora
`;
  }

  menuContent += `╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`;

  return menuContent;
}

module.exports = menubn;

