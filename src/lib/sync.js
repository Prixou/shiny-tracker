import LZString from 'lz-string';
import { normalizeHunts, normalizeShinies, normalizeHunt } from './storage.js';
import { SHINY_METHODS, POKE_BALLS, GAMES } from '../data/constants.js';
import { uid } from './utils.js';

export const APP_ID = 'shiny-hunter-pro';

export const buildExport = ({ shinies, hunts, wishlist, settings }) => ({
  app: APP_ID,
  version: 2,
  exportedAt: new Date().toISOString(),
  shinies,
  hunts: hunts.map(h => ({ ...h, startedAt: null })),
  wishlist,
  settings
});

// Accepte le format v2, l'ancien format v1 ({ shinyState, hunts }) et le format compact des QR codes.
export function parseImport(input) {
  let data = input;
  if (typeof input === 'string') {
    const text = input.trim();
    const hash = text.match(/#import=([^\s&]+)/);
    if (hash) data = decodeCompact(hash[1]);
    else if (text.startsWith('{')) data = JSON.parse(text);
    else data = decodeCompact(text);
  }
  if (!data || typeof data !== 'object') throw new Error('Format inconnu');
  if (data.c === 2) data = expandCompact(data);
  const shinies = normalizeShinies(data.shinies || data.shinyState);
  const hunts = normalizeHunts(data.hunts);
  const wishlist = data.wishlist && typeof data.wishlist === 'object' ? data.wishlist : {};
  if (!Object.keys(shinies).length && !hunts.length && !Object.keys(wishlist).length && !data.shinies && !data.shinyState) {
    throw new Error('Aucune donnée trouvée');
  }
  return { shinies, hunts, wishlist, settings: data.settings };
}

export function mergeData(current, incoming) {
  const shinies = { ...current.shinies };
  for (const [key, rec] of Object.entries(incoming.shinies)) {
    const mine = shinies[key];
    if (!mine || (rec.timestamp || 0) > (mine.timestamp || 0)) shinies[key] = rec;
  }
  const byId = new Map(current.hunts.map(h => [h.id, h]));
  for (const h of incoming.hunts) {
    const mine = byId.get(h.id);
    if (!mine || (h.updatedAt || 0) > (mine.updatedAt || 0)) byId.set(h.id, mine?.startedAt ? { ...h, startedAt: mine.startedAt } : h);
  }
  return {
    shinies,
    hunts: [...byId.values()],
    wishlist: { ...current.wishlist, ...incoming.wishlist }
  };
}

const idx = (list, id) => Math.max(0, list.findIndex(x => x.id === id));

// Format compact : suffisamment petit pour tenir dans un QR code.
export function encodeCompact({ shinies, hunts, wishlist }) {
  const compact = {
    c: 2,
    s: Object.entries(shinies).map(([k, r]) => {
      const row = [k, r.date ? Number(r.date.replace(/-/g, '')) : 0, idx(SHINY_METHODS, r.method), idx(POKE_BALLS, r.ball),
        r.game ? idx(GAMES, r.game) : -1, r.count || 0, r.odds || 0, Math.round((r.elapsedMs || 0) / 1000)];
      if (r.nickname) row.push(r.nickname);
      return row;
    }),
    h: hunts.filter(h => h.status === 'active').map(h => [h.targetId, idx(GAMES, h.game), idx(SHINY_METHODS, h.method), h.odds, h.count,
      Math.round(h.elapsedMs / 1000), h.step, h.charm ? 1 : 0, h.id]),
    w: Object.keys(wishlist).filter(k => wishlist[k])
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(compact));
}

export function decodeCompact(str) {
  const json = LZString.decompressFromEncodedURIComponent(str);
  if (!json) throw new Error('Code illisible');
  return JSON.parse(json);
}

function expandCompact(c) {
  const shinies = {};
  for (const [k, date, m, b, g, count, odds, secs, nickname] of c.s || []) {
    const d = String(date || '');
    const iso = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : '';
    shinies[k] = {
      caught: true,
      date: iso,
      timestamp: iso ? new Date(`${iso}T12:00:00`).getTime() : Date.now(),
      method: SHINY_METHODS[m]?.id,
      ball: POKE_BALLS[b]?.id,
      game: g >= 0 ? GAMES[g]?.id : '',
      count,
      odds,
      elapsedMs: secs * 1000,
      nickname: nickname || ''
    };
  }
  const hunts = (c.h || []).map(([targetId, g, m, odds, count, secs, step, charm, id]) => normalizeHunt({
    id: id || uid(), targetId, game: GAMES[g]?.id, method: SHINY_METHODS[m]?.id, odds, count,
    elapsedMs: secs * 1000, step, charm: !!charm, updatedAt: Date.now()
  }));
  const wishlist = Object.fromEntries((c.w || []).map(k => [k, true]));
  return { shinies, hunts, wishlist };
}

export const shareLink = data => `${window.location.origin}${window.location.pathname}#import=${encodeCompact(data)}`;

export function downloadFile(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareFile(filename, text) {
  const file = new File([text], filename, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Sauvegarde Shiny Hunter Pro' });
    return true;
  }
  return false;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export const backupFilename = () => `shiny-hunter-${new Date().toISOString().slice(0, 10)}.json`;
