// ==================== ECONOMY SKILLS & CHALLENGES ====================
// Skills, daily/weekly/monthly challenges, quest progress, level up.

// ===== Challenges =====
export function generateDailyChallenge(now=new Date()) {
  const end = new Date(now); end.setHours(23,59,59,999);
  const pick = (arr,n) => arr.sort(()=>Math.random()-0.5).slice(0,n);
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = pick(types,3).map(t=>({ type:t, target: 3 + Math.floor(Math.random()*5), progress:0 }));
  const reward = 300 + Math.floor(Math.random()*401);
  return { expiresAt: end.getTime(), tasks: chosen, reward, claimed:false };
}

export function ensureUserChallenge(user) {
  const now = Date.now();
  if (!user.challenge || now > (user.challenge.expiresAt||0)) user.challenge = generateDailyChallenge(new Date());
}

export function updateChallenge(user, type, inc=1, successFlag=true) {
  ensureUserChallenge(user);
  const ch = user.challenge; if (!ch || ch.claimed) return;
  ch.tasks.forEach(task => {
    if (task.type === type) {
      if (type.endsWith('Success')) { if (!successFlag) return; }
      task.progress = Math.min(task.target, (task.progress||0) + inc);
    }
  });
}

export function isChallengeCompleted(user) {
  const ch = user.challenge; if (!ch) return false;
  return ch.tasks.every(t => (t.progress||0) >= t.target);
}

export function updateQuestProgress(user, questType, inc = 1) {
  if (!user.quests || !user.quests.daily || !Array.isArray(user.quests.daily)) return;
  const questIdMap = { 'duel': 'duel_3', 'dungeon': 'dungeon_2', 'gather': 'gather_10', 'cook': 'cook_5', 'train_pet': 'train_pet' };
  const questId = questIdMap[questType] || questType;
  user.quests.daily.forEach(quest => {
    if (quest.id === questId && quest.progress < quest.goal) {
      quest.progress = Math.min(quest.goal, (quest.progress || 0) + inc);
    }
  });
}

export function checkEcoLevelUp(user) {
  let leveledUp = false;
  let expRequired = 100 * Math.pow(1.5, (user.level || 1) - 1);
  let iterations = 0;
  while (user.exp >= expRequired && iterations < 100) {
    user.exp -= expRequired;
    user.level = (user.level || 1) + 1;
    expRequired = 100 * Math.pow(1.5, (user.level || 1) - 1);
    leveledUp = true;
    iterations++;
  }
  return { leveledUp, newLevel: user.level || 1 };
}

// ===== Skills =====
export const SKILL_LIST = ['mining','working','fishing','exploring','hunting','forging','crime'];

export function ensureUserSkills(user) {
  user.skills = user.skills || {};
  for (const s of SKILL_LIST) { user.skills[s] = user.skills[s] || { level: 1, xp: 0 }; }
}

export function skillXpForNext(level) {
  return Math.floor(50 * Math.pow(1.35, Math.max(0, level - 1)));
}

export function addSkillXP(user, skill, amount=1) {
  ensureUserSkills(user);
  if (!SKILL_LIST.includes(skill)) return;
  const sk = user.skills[skill];
  sk.xp += Math.max(0, Math.floor(amount));
  let leveled = 0;
  while (sk.xp >= skillXpForNext(sk.level)) {
    sk.xp -= skillXpForNext(sk.level);
    sk.level += 1; leveled++;
    if (sk.level > 1000) break;
  }
  return leveled;
}

export function getSkillBonus(user, skill) {
  ensureUserSkills(user);
  const lvl = user.skills[skill]?.level || 1;
  return 0.02 * Math.max(0, (lvl - 1));
}

// ===== Period Challenges =====
export function endOfWeekTimestamp(date=new Date()) {
  const d = new Date(date); const day = d.getDay();
  const diff = (7 - day) % 7;
  d.setDate(d.getDate() + diff); d.setHours(23,59,59,999);
  return d.getTime();
}

export function endOfMonthTimestamp(date=new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth()+1, 0, 23,59,59,999);
  return d.getTime();
}

export function generateWeeklyChallenge(now=new Date()) {
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,4).map(t=>({ type:t, target: 15 + Math.floor(Math.random()*16), progress:0 }));
  const reward = 3000 + Math.floor(Math.random()*2001);
  return { expiresAt: endOfWeekTimestamp(now), tasks: chosen, reward, claimed:false };
}

export function generateMonthlyChallenge(now=new Date()) {
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,5).map(t=>({ type:t, target: 60 + Math.floor(Math.random()*41), progress:0 }));
  const reward = 15000 + Math.floor(Math.random()*5001);
  return { expiresAt: endOfMonthTimestamp(now), tasks: chosen, reward, claimed:false };
}

export function ensureUserPeriodChallenges(user) {
  const now = Date.now();
  if (!user.weeklyChallenge || now > (user.weeklyChallenge.expiresAt||0)) user.weeklyChallenge = generateWeeklyChallenge(new Date());
  if (!user.monthlyChallenge || now > (user.monthlyChallenge.expiresAt||0)) user.monthlyChallenge = generateMonthlyChallenge(new Date());
}

export function updatePeriodChallenge(user, type, inc=1, successFlag=true) {
  ensureUserPeriodChallenges(user);
  for (const ch of [user.weeklyChallenge, user.monthlyChallenge]) {
    if (!ch || ch.claimed) continue;
    ch.tasks.forEach(task => {
      if (task.type === type) {
        if (type.endsWith('Success') && !successFlag) return;
        task.progress = Math.min(task.target, (task.progress||0) + inc);
      }
    });
  }
}

export function isPeriodCompleted(ch) {
  if (!ch) return false; return ch.tasks.every(t => (t.progress||0) >= t.target);
}
