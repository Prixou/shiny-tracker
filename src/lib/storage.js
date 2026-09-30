import { isoFromTimestamp, uid } from './utils.js';
import { BALL_BY_ID, GAME_BY_ID, GAMES } from '../data/constants.js';
import { migrateMethod, oddsAt } from '../data/methods.js';

const KEYS = {
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

export const DEFAULT_SETTINGS = {
  haptics: true,
  keepAwake: true,
  autoPause: true,
  charm: false,
  defaultGame: 'sv',
  density: 4,
  colorUncaught: false,
  hideLocked: false,
  showVariants: false,
  animatedSprites: false,
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

export const persist = (key, value) => {
  try {
    localStorage.setItem(KEYS[key] || key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Sauvegarde impossible', e);
    return false;
  }
};

// « 12/05/2024 » (ancien format fr-FR) → « 2024-05-12 »
const parseDate = (date, ts) => {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const m = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return ts ? isoFromTimestamp(ts) : '';
};

const gameIdFrom = g => (GAME_BY_ID[g] ? g : (GAMES.find(x => x.name === g)?.id || ''));

export const CATCH_FIELDS = ['nature', 'ability', 'level', 'alpha', 'mark', 'teraType', 'language'];

export function normalizeCatch(rec, key) {
  if (!rec || rec.caught === false) return null;
  const k = String(rec.key ?? key ?? '');
  if (!k) return null;
  const { method, opts } = migrateMethod(rec.method);
  const date = parseDate(rec.date, rec.timestamp);
  const timestamp = Number(rec.timestamp) || (date ? new Date(`${date}T12:00:00`).getTime() : Date.now());
  const out = {
    id: rec.id || uid(),
    key: k,
    date,
    timestamp,
    method,
    opts: { ...opts, ...(rec.opts || {}) },
    ball: BALL_BY_ID[rec.ball] ? rec.ball : 'pokeball',
    game: gameIdFrom(rec.game),
    count: Number(rec.count) || 0,
    elapsedMs: Number(rec.elapsedMs) || (Number(rec.elapsedSeconds) || 0) * 1000,
    odds: Number(rec.odds) || Number(rec.baseOdds) || 0,
    luck: rec.luck != null ? Number(rec.luck) : null,
    phases: Number(rec.phases) || 0,
    nickname: rec.nickname || '',
    gender: rec.gender || '',
    notes: rec.notes || '',
    huntId: rec.huntId || null,
    updatedAt: Number(rec.updatedAt) || timestamp
  };
  for (const f of CATCH_FIELDS) if (rec[f] != null && rec[f] !== '') out[f] = rec[f];
  if (!out.odds) out.odds = Math.round(oddsAt({ game: out.game || 'other', method: out.method, opts: out.opts }));
  return out;
}

// Accepte un tableau de captures (v3) ou un objet { clé: capture } (v1/v2).
export function normalizeCatches(input) {
  if (Array.isArray(input)) return input.map(c => normalizeCatch(c)).filter(Boolean);
  if (input && typeof input === 'object') return Object.entries(input).map(([k, r]) => normalizeCatch(r, k)).filter(Boolean);
  return [];
}

export function normalizeHunt(h) {
  if (!h || !h.targetId) return null;
  const { method, opts } = migrateMethod(h.method);
  const game = gameIdFrom(h.game) || 'sv';
  const legacyOdds = Number(h.odds) || Number(h.baseOdds) || 0;
  // Ancien format : le taux était saisi à la main ; on le garde s'il diffère du calcul automatique.
  const auto = Math.round(oddsAt({ game, method, charm: !!h.charm, opts }));
  const customOdds = Number(h.customOdds) || (legacyOdds && Math.abs(legacyOdds - auto) > 1 && h.opts === undefined ? legacyOdds : null);
  return {
    id: String(h.id || uid()),
    targetId: String(h.targetId),
    game,
    method,
    opts: { ...opts, ...(h.opts || {}) },
    charm: !!h.charm,
    customOdds,
    count: Math.max(0, Number(h.count) || 0),
    step: Math.max(1, Number(h.step) || 1),
    phases: Array.isArray(h.phases) ? h.phases : [],
    elapsedMs: Number(h.elapsedMs) || (Number(h.elapsedSeconds) || 0) * 1000,
    startedAt: Number(h.startedAt) || null,
    status: h.status === 'done' ? 'done' : 'active',
    createdAt: h.createdAt || Date.now(),
    updatedAt: h.updatedAt || Date.now(),
    finishedAt: h.finishedAt || null,
    notes: h.notes || ''
  };
}
export const normalizeHunts = arr => (Array.isArray(arr) ? arr.map(normalizeHunt).filter(Boolean) : []);

export const normalizeLists = arr => (Array.isArray(arr) ? arr.filter(l => l && l.id && l.name).map(l => ({
  id: String(l.id), name: String(l.name).slice(0, 40), emoji: l.emoji || '📌', keys: l.keys && typeof l.keys === 'object' ? l.keys : {}, updatedAt: l.updatedAt || Date.now()
})) : []);

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
};
