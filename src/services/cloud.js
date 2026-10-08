import { mergeData } from '../domain/backup.js';
import { normalizeCatches } from '../domain/catch.js';
import { normalizeHunts } from '../domain/hunt.js';
import { normalizeLists } from '../domain/lists.js';

// Synchronisation cloud (Supabase). Une ligne par utilisateur dans `shiny_data` contient tout le document.
export const TABLE = 'shiny_data';
const CONFIG_KEY = 'shp:cloud-config';
const META_KEY = 'shp:cloud-meta';

export function getCloudConfig() {
  const env = { url: import.meta.env?.VITE_SUPABASE_URL, key: import.meta.env?.VITE_SUPABASE_ANON_KEY };
  if (env.url && env.key) return { ...env, source: 'build' };
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    if (saved?.url && saved?.key) return { ...saved, source: 'local' };
  } catch { /* ignoré */ }
  return null;
}
export const saveCloudConfig = cfg => (cfg ? localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)) : localStorage.removeItem(CONFIG_KEY));

export const loadMeta = () => {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch { return {}; }
};
export const saveMeta = meta => localStorage.setItem(META_KEY, JSON.stringify(meta));

let clientPromise = null;
export function getClient(cfg) {
  if (!cfg) return null;
  clientPromise ||= import('@supabase/supabase-js').then(({ createClient }) => createClient(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }));
  return clientPromise;
}
export const resetClient = () => { clientPromise = null; };

// Document synchronisé (les réglages restent propres à chaque appareil).
export const toDoc = ({ catches, hunts, wishlist, lists }) => ({
  v: 3, catches, hunts: hunts.map(h => ({ ...h, startedAt: null })), wishlist, lists
});
export const fromDoc = doc => ({
  catches: normalizeCatches(doc?.catches || []),
  hunts: normalizeHunts(doc?.hunts || []),
  wishlist: doc?.wishlist && typeof doc.wishlist === 'object' ? doc.wishlist : {},
  lists: normalizeLists(doc?.lists || [])
});
export const isEmptyDoc = d => !d.catches.length && !d.hunts.length && !d.lists.length && !Object.keys(d.wishlist).length;

export async function pullRemote(client, userId) {
  const { data, error } = await client.from(TABLE).select('doc, client_stamp, updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function pushRemote(client, userId, doc) {
  const stamp = Date.now();
  const { error } = await client.from(TABLE).upsert({ user_id: userId, doc, client_stamp: stamp, updated_at: new Date(stamp).toISOString() });
  if (error) throw error;
  return stamp;
}

/**
 * Un cycle de synchronisation.
 * - local : données actuelles ; dirty : modifications locales non envoyées.
 * - meta.remoteStamp : dernière version distante connue ; meta.userId : compte lié à cet appareil.
 * Renvoie { action, doc?, stamp? } :
 *   'conflict' (premier lien avec des données des deux côtés), 'apply' (remplacer localement),
 *   'push' (envoyé), 'merge' (fusionné, envoyé et à appliquer), 'none'.
 */
export async function syncCycle({ client, userId, local, dirty, meta, force = null }) {
  const row = await pullRemote(client, userId);
  const remote = row ? fromDoc(row.doc) : null;
  const firstLink = meta.userId !== userId;

  if (force === 'local' || !row) {
    const stamp = await pushRemote(client, userId, toDoc(local));
    return { action: 'push', stamp };
  }
  if (force === 'cloud') return { action: 'apply', doc: remote, stamp: row.client_stamp };
  if (force === 'merge') {
    const merged = mergeData(local, remote);
    const stamp = await pushRemote(client, userId, toDoc(merged));
    return { action: 'merge', doc: merged, stamp };
  }
  if (firstLink) {
    if (isEmptyDoc(local)) return { action: 'apply', doc: remote, stamp: row.client_stamp };
    if (isEmptyDoc(remote)) {
      const stamp = await pushRemote(client, userId, toDoc(local));
      return { action: 'push', stamp };
    }
    return { action: 'conflict', remote, stamp: row.client_stamp };
  }
  const remoteChanged = Number(row.client_stamp) > Number(meta.remoteStamp || 0);
  if (remoteChanged && dirty) {
    const merged = mergeData(local, remote);
    const stamp = await pushRemote(client, userId, toDoc(merged));
    return { action: 'merge', doc: merged, stamp };
  }
  if (remoteChanged) return { action: 'apply', doc: remote, stamp: row.client_stamp };
  if (dirty) {
    const stamp = await pushRemote(client, userId, toDoc(local));
    return { action: 'push', stamp };
  }
  return { action: 'none', stamp: row.client_stamp };
}
