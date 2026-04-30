import { PREFIX } from "../../config.js";

export default {
  name: "rental_system",
  description: "Gerenciamento de aluguel de grupos",
  commands: ["addaluguel", "adddiasaluguel", "aluguelist", "cancelaraluguel", "dayfree", "deletaraluguel", "detalhesaluguel", "estenderaluguel", "extenderrental", "infoaluguel", "listaaluguel", "listaluguel", "listaralugueis", "listaraluguel", "listrentals", "removeraluguel", "statusaluguel", "veralugueis"],
  handle: async ({ 
    nazu, from, info, command, args, reply, q, isOwner, isGroup, prefix,
    loadRentalData, saveRentalData, setGroupRental, extendGroupRental,
    getCachedGroupMetadata, OWNER_ONLY_MESSAGE, optimizer,
    MESSAGES
  }) => {
    if (!isOwner) return reply(OWNER_ONLY_MESSAGE);

    const cmd = command.toLowerCase();

    // 📊 LISTAGEM
    if (['listaralugueis', 'aluguelist', 'listaluguel', 'listaaluguel', 'listaraluguel', 'veralugueis', 'listrentals', 'listarentals', 'aluguel.lista', 'aluguel.ver'].includes(cmd)) {
      const data = loadRentalData();
      const groups = Object.entries(data.groups || {});
      if (!groups.length) return reply("📪 Sem aluguéis.");
      let text = `╭───「 *Lista de Aluguéis* 」───╮\n\n`;
      for (let i = 0; i < groups.length; i++) {
        const [id, info] = groups[i];
        const meta = await getCachedGroupMetadata(id).catch(() => ({ subject: 'Desconhecido' }));
        text += `${i + 1}. ${meta.subject}\n🆔 ${id}\n📅 Expira: ${info.expiresAt === 'permanent' ? '∞' : new Date(info.expiresAt).toLocaleDateString()}\n\n`;
      }
      return reply(text);
    }

    // ➕ ADICIONAR
    if (cmd === 'addaluguel') {
      if (!isGroup) return reply("Use no grupo!");
      const res = setGroupRental(from, q.trim() === 'permanent' ? 'permanent' : parseInt(q), prefix);
      return reply(res.message);
    }

    // 🗑️ REMOVER
    if (['removeraluguel', 'deletaraluguel', 'cancelaraluguel', 'delaluguel', 'aluguel.remover'].includes(cmd)) {
      const target = q?.trim() || (isGroup ? from : null);
      if (!target) return reply("Informe o ID!");
      const data = loadRentalData();
      delete data.groups[target.includes('@g.us') ? target : target + '@g.us'];
      saveRentalData(data);
      return reply("✅ Removido.");
    }
    // ...
  }
};
