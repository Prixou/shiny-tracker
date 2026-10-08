// Lecture et écriture du stockage local (localStorage), migration des anciennes clés comprise.
/** @import { AppData } from '../domain/types.js' */
/** @import { Settings } from '../domain/settings.js' */
import { normalizeCatches } from '../domain/catch.js';
import { normalizeHunts } from '../domain/hunt.js';
import { normalizeLists } from '../domain/lists.js';
import { DEFAULT_SETTINGS } from '../domain/settings.js';

export const KEYS = {
  catches: 'shp:catches',
  hunts: 'shp:hunts',
  wishlist: 'shp:wishlist',
  lists: 'shp:lists',
  settings: 'shp:settings',
  ui: 'shp:ui',
  stamp: 'shp:stamp'
};
// Anciennes clés : v2 (un seul shiny par espèce) et v1 (fichier app.jsx d'origine).
const LEGACY = { shinies: 'shp:shinies', v1Shinies: 'shiny_tracker_data_v2', v1Hunts: 'shiny_hunts_v1' };
// Conversation de l'assistant (sa clé API, elle, n'est jamais effacée ni exportée).
const AI_CHAT_KEY = 'shp:ai-chat';

const read = key => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

/** Écrit une tranche de l'état (`key` : nom de tranche ou clé brute). */
export const persist = (key, value) => {
  try {
    localStorage.setItem(KEYS[key] || key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Sauvegarde impossible', e);
    return false;
  }
};

/**
 * État initial lu depuis l'appareil, au format actuel.
 * @returns {AppData & { settings: Settings, ui: Record<string, any>, stamp: number }}
 */
export function loadState() {
  let catches = read(KEYS.catches);
  const migrated = catches === undefined;
  if (migrated) {
    const v2 = read(LEGACY.shinies);
    catches = normalizeCatches(v2 !== undefined ? v2 : read(LEGACY.v1Shinies));
  } else {
    catches = normalizeCatches(catches);
  }
  let hunts = read(KEYS.hunts);
  hunts = normalizeHunts(hunts === undefined ? read(LEGACY.v1Hunts) : hunts);
  // Les anciennes clés sont conservées comme copie de secours ; le nouveau format est écrit tout de suite.
  if (migrated && catches.length) {
    persist('catches', catches);
    persist('hunts', hunts);
  }
  return {
    catches,
    hunts,
    wishlist: read(KEYS.wishlist) || {},
    lists: normalizeLists(read(KEYS.lists)),
    settings: { ...DEFAULT_SETTINGS, ...(read(KEYS.settings) || {}) },
    ui: read(KEYS.ui) || {},
    stamp: Number(read(KEYS.stamp)) || 0
  };
}

export const clearAll = () => {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  Object.values(LEGACY).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem(AI_CHAT_KEY);
};

// Tranches enregistrées, chacune sous sa propre clé.
const SAVED = ['catches', 'hunts', 'wishlist', 'lists', 'settings', 'ui', 'stamp'];

/**
 * Enregistre automatiquement les tranches modifiées du store (regroupées par `delay` ms).
 * Renvoie { flush, detach } : `flush` écrit tout de suite ce qui est en attente.
 * @param {import('zustand/vanilla').StoreApi<any>} store
 * @param {{ delay?: number }} [options]
 */
export function attachPersistence(store, { delay = 250 } = {}) {
  const timers = new Map();
  const write = key => {
    clearTimeout(timers.get(key));
    timers.delete(key);
    persist(key, store.getState()[key]);
  };
  const unsubscribe = store.subscribe((state, prev) => {
    for (const key of SAVED) {
      if (state[key] === prev[key]) continue;
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => write(key), delay));
    }
  });
  const flush = () => [...timers.keys()].forEach(write);
  return { flush, detach: () => { unsubscribe(); flush(); } };
}
