import { USyncQuery, USyncUser } from 'baileys';
import { isJidGroup, isJidStatusBroadcast, isLidUser, jidDecode, jidEncode, jidNormalizedUser } from 'baileys';
import { lidCache } from './lidCache.js';

function normalizeToPN(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isLidUser(trimmed)) return null;

  const decoded = jidDecode(trimmed);

  if (decoded) {
    const { server, user } = decoded;
    if (server === 'g.us' || server === 'broadcast' || server === 'newsletter') return null;
    if (server === 's.whatsapp.net' || server === 'c.us') return jidEncode(user, 's.whatsapp.net');
    return null;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return null;

  return jidEncode(digits, 's.whatsapp.net');
}

export async function toLID(input, bot) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isLidUser(trimmed)) return jidNormalizedUser(trimmed);
  if (isJidGroup(trimmed) || isJidStatusBroadcast(trimmed)) return null;

  const pn = normalizeToPN(trimmed);
  if (!pn) return null;

  const user = jidDecode(pn)?.user;
  if (!user) return null;

  // 1. cache em memoria/arquivo
  await lidCache.load();
  const cached = lidCache.get(pn);
  if (cached) return cached;

  // 2. tenta o store local do Baileys
  try {
    if (bot?.signalRepository?.lidMapping?.getLIDForPN) {
      const fromStore = await bot.signalRepository.lidMapping.getLIDForPN(pn);
      if (fromStore) {
        lidCache.set(pn, fromStore);
        return fromStore;
      }
    }
  } catch (storeError) {
    // ignorar erros do signalRepository
  }

  // 3. consulta USync diretamente com LIDProtocol
  try {
    const query = new USyncQuery()
      .withLIDProtocol()
      .withContext('interactive')
      .withUser(new USyncUser().withId(pn));

    const result = await Promise.race([
      bot.executeUSyncQuery(query),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout executeUSyncQuery')), 3000))
    ]);
    const entry = result?.list.find((r) => r.id === pn);
    const lid = entry?.['lid'];
    const normalized = lid ? jidNormalizedUser(lid) : null;

    if (normalized) {
      lidCache.set(pn, normalized);
    }
    return normalized;
  } catch (uSyncError) {
    return null;
  }
}

export default toLID;
