import { getLidFromJidCached } from './helpers.js';

class GroupCache {
  constructor() {
    this.cache = new Map();
  }

  async normalizeParticipant(participant, bot) {
    try {
      const lid = await getLidFromJidCached(bot, participant.id);
      if (!lid) return null;
      return { ...participant, id: lid };
    } catch (e) {
      return participant;
    }
  }

  async normalizeParticipants(participants, bot) {
    if (!Array.isArray(participants)) return [];
    const normalized = await Promise.all(
      participants.map((participant) => this.normalizeParticipant(participant, bot))
    );
    return normalized.filter((p) => p !== null);
  }

  async set(data, bot) {
    if (!data || !data.id) return;
    const participants = data.participants
      ? await this.normalizeParticipants(data.participants, bot)
      : [];
    this.cache.set(data.id, { ...data, participants });
  }

  get(id) {
    return this.cache.get(id);
  }

  async patch(id, partial, bot) {
    const existing = this.cache.get(id);
    if (existing) {
      const participants = partial.participants
        ? await this.normalizeParticipants(partial.participants, bot)
        : existing.participants;

      this.cache.set(id, { ...existing, ...partial, participants });
    }
  }

  async updateParticipants(id, participants, action, bot) {
    const group = this.cache.get(id);
    if (!group) return;

    const normalizedParticipants = await this.normalizeParticipants(participants, bot);
    let updated = [...(group.participants || [])];

    if (action === 'add') {
      const newOnes = normalizedParticipants.filter((p) => !updated.some((u) => u.id === p.id));
      updated = [...updated, ...newOnes];
    } else if (action === 'remove') {
      const ids = new Set(normalizedParticipants.map((p) => p.id));
      updated = updated.filter((p) => !ids.has(p.id));
    } else if (action === 'promote') {
      const ids = new Set(normalizedParticipants.map((p) => p.id));
      updated = updated.map((p) => (ids.has(p.id) ? { ...p, admin: 'admin', isAdmin: true } : p));
    } else if (action === 'demote') {
      const ids = new Set(normalizedParticipants.map((p) => p.id));
      updated = updated.map((p) => (ids.has(p.id) ? { ...p, admin: null, isAdmin: false } : p));
    } else if (action === 'modify') {
      const map = new Map(normalizedParticipants.map((p) => [p.id, p]));
      updated = updated.map((p) => (map.has(p.id) ? { ...p, ...map.get(p.id) } : p));
    }

    this.cache.set(id, { ...group, participants: updated });
  }

  async ensure(id, bot) {
    if (this.cache.has(id)) return this.cache.get(id);

    try {
      const originalMetadataFn = bot.originalGroupMetadata || bot.groupMetadata;
      const meta = await originalMetadataFn(id);
      await this.set(meta, bot);
      return this.cache.get(id);
    } catch (e) {
      return undefined;
    }
  }

  async ensureAndPatch(id, partial, bot) {
    await this.ensure(id, bot);
    await this.patch(id, partial, bot);
  }

  async ensureAndUpdateParticipants(id, participants, action, bot) {
    await this.ensure(id, bot);
    await this.updateParticipants(id, participants, action, bot);
  }

  registerEvents(bot) {
    // Store original method for ensure()
    if (!bot.originalGroupMetadata) {
      bot.originalGroupMetadata = bot.groupMetadata.bind(bot);
      // Proxy groupMetadata to automatically use cache
      bot.groupMetadata = async (id) => {
        return await this.ensure(id, bot);
      };
    }

    bot.ev.on('groups.upsert', (groups) => {
      for (const group of groups) {
        this.set(group, bot).catch(() => {});
      }
    });

    bot.ev.on('groups.update', (updates) => {
      for (const update of updates) {
        if (update.id) {
          this.ensureAndPatch(update.id, update, bot).catch(() => {});
        }
      }
    });

    bot.ev.on('group-participants.update', ({ id, participants, action }) => {
      this.ensureAndUpdateParticipants(id, participants, action, bot).catch(() => {});
    });
  }
}

export const groupCache = new GroupCache();
export default groupCache;
