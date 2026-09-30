import { isoFromTimestamp, uid } from './utils.js';
import { methodOdds, METHOD_BY_ID, BALL_BY_ID, GAME_BY_ID } from '../data/constants.js';

const KEYS = {
  shinies: 'shp:shinies',
  hunts: 'shp:hunts',
  wishlist: 'shp:wishlist',
  settings: 'shp:settings',
  ui: 'shp:ui'
};
const LEGACY = { shinies: 'shiny_tracker_data_v2', hunts: 'shiny_hunts_v1' };

export const DEFAULT_SETTINGS = {
  haptics: true,
  keepAwake: true,
  autoPause: true,
  charm: false,
  defaultGame: 'sv',
  defaultMethod: 'wild',
  density: 4,
  colorUncaught: false,
  hideLocked: false,
  confirmUncatch: true,
  sound: false
};

const read = key => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const write = (key, value) => {
  try {
    localStorage.setItem(KEYS[key] || key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Sauvegarde impossible', e);
    return false;
  }
};

// « 12/05/2024 » (ancien format fr-FR) → « 2024-05-12 »
const parseLegacyDate = (date, ts) => {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const m = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return ts ? isoFromTimestamp(ts) : '';
};

export const normalizeShiny = rec => {
  if (!rec || !rec.caught) return null;
  const method = METHOD_BY_ID[rec.method] ? rec.method : 'wild';
  const date = parseLegacyDate(rec.date, rec.timestamp);
  return {
    caught: true,
    date,
    timestamp: rec.timestamp || (date ? new Date(`${date}T12:00:00`).getTime() : Date.now()),
    method,
    ball: BALL_BY_ID[rec.ball] ? rec.ball : 'pokeball',
    game: GAME_BY_ID[rec.game] ? rec.game : '',
    count: Number(rec.count) || 0,
    elapsedMs: Number(rec.elapsedMs) || (Number(rec.elapsedSeconds) || 0) * 1000,
    odds: Number(rec.odds) || Number(rec.baseOdds) || methodOdds(method, false),
    phases: Number(rec.phases) || 0,
    nickname: rec.nickname || '',
    gender: rec.gender || '',
    notes: rec.notes || '',
    huntId: rec.huntId || null
  };
};

export const normalizeHunt = h => {
  if (!h || !h.targetId) return null;
  const method = METHOD_BY_ID[h.method] ? h.method : 'wild';
  const game = GAME_BY_ID[h.game] ? h.game : (Object.values(GAME_BY_ID).find(g => g.name === h.game)?.id || 'sv');
  return {
    id: h.id || uid(),
    targetId: String(h.targetId),
    game,
    method,
    charm: !!h.charm,
    odds: Number(h.odds) || Number(h.baseOdds) || methodOdds(method, !!h.charm),
    count: Math.max(0, Number(h.count) || 0),
    step: Math.max(1, Number(h.step) || 1),
    phases: Array.isArray(h.phases) ? h.phases : [],
    elapsedMs: Number(h.elapsedMs) || (Number(h.elapsedSeconds) || 0) * 1000,
    startedAt: null,
    status: h.status === 'done' ? 'done' : 'active',
    createdAt: h.createdAt || Date.now(),
    updatedAt: h.updatedAt || Date.now(),
    finishedAt: h.finishedAt || null,
    notes: h.notes || ''
  };
};

export const normalizeShinies = obj => {
  const out = {};
  if (obj && typeof obj === 'object') {
    for (const [key, rec] of Object.entries(obj)) {
      const n = normalizeShiny(rec);
      if (n) out[String(key)] = n;
    }
  }
  return out;
};

export const normalizeHunts = arr => (Array.isArray(arr) ? arr.map(normalizeHunt).filter(Boolean) : []);

export function loadState() {
  let shinies = read(KEYS.shinies);
  let hunts = read(KEYS.hunts);
  if (shinies === undefined) shinies = normalizeShinies(read(LEGACY.shinies));
  if (hunts === undefined) hunts = normalizeHunts(read(LEGACY.hunts));
  return {
    shinies: shinies || {},
    hunts: hunts || [],
    wishlist: read(KEYS.wishlist) || {},
    settings: { ...DEFAULT_SETTINGS, ...(read(KEYS.settings) || {}) },
    ui: read(KEYS.ui) || {}
  };
}

export const persist = (key, value) => write(KEYS[key], value);

export const clearAll = () => {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  Object.values(LEGACY).forEach(k => localStorage.removeItem(k));
};
