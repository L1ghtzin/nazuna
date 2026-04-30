import { PREFIX } from "../../config.js";

export default {
  name: "logos",
  description: "Geração de logotipos personalizados",
  commands: [
    "darkgreen", "glitch", "write", "advanced", "typography", "pixel", "neon", "flag", "americanflag", "deleting",
    "pornhub", "avengers", "graffiti", "captainamerica", "stone3d", "neon2", "thor", "amongus", "deadpool", "blackpink"
  ],
  usage: `${PREFIX}avengers Nazuna/Bot`,
  handle: async ({ 
    reply, 
    command, 
    q, 
    Logos, 
    Logos2, 
    nazu, 
    from, 
    info,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();
    
    // Lista de comandos que usam Logos (1 texto)
    const singleTextLogos = ["darkgreen", "glitch", "write", "advanced", "typography", "pixel", "neon", "flag", "americanflag", "deleting"];
    
    // Lista de comandos que usam Logos2 (2 textos separados por /)
    const doubleTextLogos = ["pornhub", "avengers", "graffiti", "captainamerica", "stone3d", "neon2", "thor", "amongus", "deadpool", "blackpink"];

    if (singleTextLogos.includes(cmd)) {
      if (!q) return reply(`💔 Cadê o texto?\nExemplo: ${PREFIX}${cmd} Olá Mundo`);
      
      const modelo = cmd;
      await reply(`⏳ Gerando logotipo *${modelo.charAt(0).toUpperCase() + modelo.slice(1)}*... aguarde!`);

      try {
        const logoGenerator = new Logos(q, modelo);
        const resultado = await logoGenerator.gerarLogotipo();

        if (resultado.success) {
          const nomeModelo = modelo === 'americanflag' ? 'American Flag' : modelo.charAt(0).toUpperCase() + modelo.slice(1);
          await nazu.sendMessage(from, { 
            image: { url: resultado.imageUrl }, 
            caption: `✅ *Logotipo ${nomeModelo} gerado com sucesso!*` 
          }, { quoted: info });
        } else {
          await reply(MESSAGES.error.general);
        }
      } catch (e) {
        console.error(`Erro no comando ${cmd}:`, e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    if (doubleTextLogos.includes(cmd)) {
      const [texto1, texto2] = q.split('/').map(i => i.trim());
      if (!texto1 || !texto2) return reply(`💔 Cadê os textos?\nExemplo: ${PREFIX}${cmd} Nazuna/Bot`);

      const modelo = cmd;
      await reply(`⏳ Gerando logotipo *${modelo.charAt(0).toUpperCase() + modelo.slice(1)}*... aguarde!`);

      try {
        const logoGenerator = new Logos2(texto1, texto2, modelo);
        const resultado = await logoGenerator.gerarLogotipo();

        if (resultado.success) {
          const nomeModelo = modelo.charAt(0).toUpperCase() + modelo.slice(1);
          await nazu.sendMessage(from, { 
            image: { url: resultado.imageUrl }, 
            caption: `✅ *Logotipo ${nomeModelo} gerado com sucesso!*` 
          }, { quoted: info });
        } else {
          await reply(MESSAGES.error.general);
        }
      } catch (e) {
        console.error(`Erro no comando ${cmd}:`, e);
        await reply(MESSAGES.error.general);
      }
      return;
    }
  },
};
