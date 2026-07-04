// ==================== ECONOMY PETS ====================
// Pet migration/validation and degradation system.

export function migrateAndValidatePet(pet) {
  if (!pet || typeof pet !== 'object') return null;
  const validateNumber = (value, defaultValue = 0) => {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.max(0, Math.floor(value));
  };
  const validateObject = (value, defaultValue = {}) => {
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : defaultValue;
  };
  return {
    name: pet.name || 'Pet', emoji: pet.emoji || '🐾', type: pet.type || 'lobo',
    hp: validateNumber(pet.hp, 100), maxHp: validateNumber(pet.maxHp, 100),
    attack: validateNumber(pet.attack, 15), defense: validateNumber(pet.defense, 10), speed: validateNumber(pet.speed, 18),
    element: pet.element || 'normal',
    level: validateNumber(pet.level, 1), exp: validateNumber(pet.exp, 0), evolutions: validateNumber(pet.evolutions, 0),
    hunger: validateNumber(pet.hunger, 100), mood: validateNumber(pet.mood, 100),
    wins: validateNumber(pet.wins, 0), losses: validateNumber(pet.losses, 0),
    equipment: validateObject(pet.equipment),
    lastUpdate: validateNumber(pet.lastUpdate, Date.now()), lastTrain: validateNumber(pet.lastTrain, 0),
    cost: validateNumber(pet.cost, 5000)
  };
}

export function applyPetDegradation(pets) {
  if (!Array.isArray(pets) || pets.length === 0) return { changed: false };
  const now = Date.now(); const oneHour = 3600000; const oneDayInHours = 24;
  let changed = false;
  pets.forEach(pet => {
    if (!pet.lastUpdate) { pet.lastUpdate = now; changed = true; return; }
    const timePassed = now - pet.lastUpdate;
    const hoursPassed = timePassed / oneHour;
    if (hoursPassed >= 1) {
      const hungerDegrade = Math.floor(hoursPassed * (100 / oneDayInHours));
      const moodDegrade = Math.floor(hoursPassed * (100 / (oneDayInHours * 2)));
      const oldHunger = pet.hunger || 100; const oldMood = pet.mood || 100;
      pet.hunger = Math.max(0, oldHunger - hungerDegrade);
      pet.mood = Math.max(0, oldMood - moodDegrade);
      if (pet.hunger < 30) pet.mood = Math.max(0, pet.mood - Math.floor(hoursPassed * 5));
      if (pet.hunger === 0 && hoursPassed >= 2) {
        const hpLoss = Math.floor(hoursPassed * (pet.maxHp * 0.02));
        pet.hp = Math.max(1, (pet.hp || pet.maxHp) - hpLoss);
      }
      pet.lastUpdate = now; changed = true;
    }
  });
  return { changed };
}
