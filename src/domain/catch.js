// Captures (exemplaires shiny) : création et migration des anciennes sauvegardes.
import { BALL_BY_ID } from '../data/constants.js';
import { gameIdFrom } from '../data/games.js';
import { migrateMethod, oddsAt } from '../data/methods.js';
import { isoFromTimestamp, timestampFromIso, todayIso } from '../lib/format.js';
import { uid } from '../lib/id.js';
import { defaultMethodFor } from './hunt.js';
import { hasCharm } from './settings.js';

// Détails facultatifs, conservés seulement s'ils sont renseignés.
export const CATCH_FIELDS = ['nature', 'ability', 'level', 'alpha', 'mark', 'teraType', 'language', 'inHome'];

/** Nouvelle capture : jeu par défaut, méthode du jeu et taux calculé (Charme selon « Mes jeux »). */
export function createCatch(key, extra = {}, settings = {}, now = Date.now()) {
  const game = extra.game ?? settings.defaultGame ?? 'sv';
  const method = extra.method || defaultMethodFor(game);
  return {
    id: uid(), key: String(key), date: todayIso(), timestamp: now, method, opts: {}, ball: 'pokeball', game,
    count: 0, elapsedMs: 0, odds: Math.round(oddsAt({ game, method, charm: hasCharm(settings, game), opts: extra.opts || {} })), luck: null,
    phases: 0, nickname: '', gender: '', notes: '', huntId: null, updatedAt: now, ...extra
  };
}

// « 12/05/2024 » (ancien format fr-FR) → « 2024-05-12 »
const parseDate = (date, ts) => {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const m = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return ts ? isoFromTimestamp(ts) : '';
};

/** Capture au format actuel à partir de n'importe quelle version (null si inexploitable). */
export function normalizeCatch(rec, key) {
  if (!rec || rec.caught === false) return null;
  const k = String(rec.key ?? key ?? '');
  if (!k) return null;
  const { method, opts } = migrateMethod(rec.method);
  const date = parseDate(rec.date, rec.timestamp);
  const timestamp = Number(rec.timestamp) || (date ? timestampFromIso(date) : Date.now());
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

/** Accepte un tableau de captures (v3) ou un objet { clé: capture } (v1/v2). */
export function normalizeCatches(input) {
  if (Array.isArray(input)) return input.map(c => normalizeCatch(c)).filter(Boolean);
  if (input && typeof input === 'object') return Object.entries(input).map(([k, r]) => normalizeCatch(r, k)).filter(Boolean);
  return [];
}

/** Dernière capture de chaque espèce (la plus récente). */
export function latestByKey(catches) {
  const map = {};
  for (const c of catches) if (!map[c.key] || c.timestamp > map[c.key].timestamp) map[c.key] = c;
  return map;
}

/** Tous les exemplaires de chaque espèce, du plus récent au plus ancien. */
export function groupByKey(catches) {
  const map = {};
  for (const c of catches) (map[c.key] ||= []).push(c);
  Object.values(map).forEach(arr => arr.sort((a, b) => b.timestamp - a.timestamp));
  return map;
}
