const CONSUMABLES_CONFIG = {
  mate: {
    name: 'Mate',
    emoji: '🧉',
    effects: {
      workCooldownReduction: 5 * 60 * 1000
    },
    dailyLimit: 3,
    description: 'Reduz o cooldown atual de trabalhar de forma aleatória proporcional (mínimo 1 minuto, máximo 8 minutos)'
  }
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getConsumableConfig(consumableId) {
  return CONSUMABLES_CONFIG[consumableId] || null;
}

export function getAllConsumables() {
  return CONSUMABLES_CONFIG;
}

export function initializeConsumableUsage(user) {
  if (!user.consumableUsage) user.consumableUsage = {};
  if (!user.consumableEffects) user.consumableEffects = {};
}

export function resetDailyUsageIfNecessary(user, consumableId) {
  initializeConsumableUsage(user);
  const now = Date.now();
  const usage = user.consumableUsage[consumableId];

  if (!usage) {
    user.consumableUsage[consumableId] = { count: 0, lastReset: now };
    return;
  }

  const timeSinceReset = now - usage.lastReset;
  if (timeSinceReset >= ONE_DAY_MS) {
    user.consumableUsage[consumableId] = { count: 0, lastReset: now };
  }
}

export function getDailyUsageCount(user, consumableId) {
  resetDailyUsageIfNecessary(user, consumableId);
  return user.consumableUsage[consumableId]?.count || 0;
}

export function hasReachedDailyLimit(user, consumableId) {
  const config = getConsumableConfig(consumableId);
  if (!config) return true;

  const usageCount = getDailyUsageCount(user, consumableId);
  return usageCount >= config.dailyLimit;
}

export function incrementDailyUsage(user, consumableId) {
  resetDailyUsageIfNecessary(user, consumableId);
  if (!user.consumableUsage[consumableId]) {
    user.consumableUsage[consumableId] = { count: 0, lastReset: Date.now() };
  }
  user.consumableUsage[consumableId].count += 1;
}

export function hasActiveEffect(user, consumableId) {
  initializeConsumableUsage(user);
  return user.consumableEffects[consumableId]?.active === true;
}

export function activateEffect(user, consumableId, customData = {}) {
  initializeConsumableUsage(user);
  user.consumableEffects[consumableId] = {
    active: true,
    activatedAt: Date.now(),
    ...customData
  };
}

export function consumeEffect(user, consumableId) {
  initializeConsumableUsage(user);
  if (user.consumableEffects[consumableId]) {
    user.consumableEffects[consumableId].active = false;
  }
}

export function getEffectValue(user, consumableId, effectKey) {
  const config = getConsumableConfig(consumableId);
  if (!config || !config.effects[effectKey]) return 0;
  if (!hasActiveEffect(user, consumableId)) return 0;
  return config.effects[effectKey];
}

export function getWorkCooldownReduction(user) {
  let totalReduction = 0;
  for (const consumableId of Object.keys(CONSUMABLES_CONFIG)) {
    if (hasActiveEffect(user, consumableId)) {
      if (consumableId === 'mate') {
        const storedReduction = user.consumableEffects[consumableId]?.reductionMin || 5;
        totalReduction += storedReduction * 60000;
      } else {
        const config = CONSUMABLES_CONFIG[consumableId];
        if (config.effects.workCooldownReduction) {
          totalReduction += config.effects.workCooldownReduction;
        }
      }
    }
  }
  return totalReduction;
}

export function hasConsumableInInventory(user, consumableId) {
  const inventory = user.inventory || {};
  return (inventory[consumableId] || 0) > 0;
}

export function consumeFromInventory(user, consumableId) {
  if (!user.inventory) user.inventory = {};
  if ((user.inventory[consumableId] || 0) <= 0) return false;
  user.inventory[consumableId] -= 1;
  if (user.inventory[consumableId] <= 0) {
    delete user.inventory[consumableId];
  }
  return true;
}

export function useConsumable(user, consumableId) {
  const config = getConsumableConfig(consumableId);
  if (!config) return { success: false, error: 'invalid_consumable' };

  if (!hasConsumableInInventory(user, consumableId)) {
    return { success: false, error: 'not_in_inventory' };
  }

  if (hasReachedDailyLimit(user, consumableId)) {
    return { success: false, error: 'daily_limit_reached', limit: config.dailyLimit };
  }

  const now = Date.now();

  if (consumableId === 'mate') {
    // 1. Verificar cooldown de uso próprio
    const lastUsed = user.cooldowns?.use_mate || 0;
    if (now < lastUsed) {
      return { success: false, error: 'use_cooldown', timeLeft: lastUsed - now };
    }

    const cd = user.cooldowns?.work || 0;
    if (now >= cd) {
      return { success: false, error: 'not_tired' };
    }

    // 2. Redução de cooldown de trabalho ativa (aleatória proporcional e baseada em qualidade)
    consumeFromInventory(user, consumableId);
    incrementDailyUsage(user, consumableId);

    const remainingMin = Math.ceil((cd - now) / 60000);
    
    // Rolar qualidade do mate:
    // 20% lavado (washed)
    // 70% quentinho (standard)
    // 10% especial (special)
    const roll = Math.random();
    let quality = 'standard';
    let reductionMin = 3;

    if (roll < 0.20) {
      quality = 'washed';
      reductionMin = 1;
    } else if (roll < 0.90) {
      quality = 'standard';
      const maxReduction = Math.min(5, Math.max(2, Math.ceil(remainingMin * 0.4)));
      reductionMin = Math.max(2, 1 + Math.floor(Math.random() * maxReduction));
    } else {
      quality = 'special';
      const maxReduction = Math.min(10, Math.max(5, Math.ceil(remainingMin * 0.7)));
      reductionMin = Math.max(5, 1 + Math.floor(Math.random() * maxReduction));
    }

    // Garantir que a redução não ultrapasse o tempo de cooldown restante
    reductionMin = Math.min(remainingMin, reductionMin);
    const reductionMs = reductionMin * 60000;

    user.cooldowns.work = Math.max(now, cd - reductionMs);
    
    // Aplicar cooldown próprio do mate (2 minutos)
    user.cooldowns.use_mate = now + 2 * 60 * 1000;

    return {
      success: true,
      config,
      usageCount: getDailyUsageCount(user, consumableId),
      dailyLimit: config.dailyLimit,
      appliedDirectly: true,
      reductionMin,
      quality
    };
  }

  if (hasActiveEffect(user, consumableId)) {
    return { success: false, error: 'effect_already_active' };
  }

  consumeFromInventory(user, consumableId);
  incrementDailyUsage(user, consumableId);
  activateEffect(user, consumableId);

  return {
    success: true,
    config,
    usageCount: getDailyUsageCount(user, consumableId),
    dailyLimit: config.dailyLimit,
    appliedDirectly: false
  };
}
