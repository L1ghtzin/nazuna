const menus = {
  menu: require('./menu'),
  menuAlterador: require('./alteradores'),
  menudown: require('./menudown'),
  menuadm: require('./menuadm'),
  menubn: require('./menubn'),
  menuDono: require('./menudono'),
  menuMembros: require('./menumemb'),
  menuFerramentas: require('./ferramentas'),
  menuSticker: require('./menufig'),
  menuIa: require('./menuia'),
  menuTopCmd: require('./topcmd')
};


function validateMenus() {
  const invalidMenus = Object.entries(menus).filter(([name, menu]) => !menu || typeof menu !== 'function').map(([name]) => name);
  if (invalidMenus.length) {
    console.warn(`[${new Date().toISOString()}] Menus inválidos detectados: ${invalidMenus.join(', ')}`);
    return false;
  }
  return true;
};


if (!validateMenus()) {
  console.error(`[${new Date().toISOString()}] Erro: Um ou mais menus não foram carregados corretamente.`);
};


module.exports = menus;