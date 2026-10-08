import LZString from 'lz-string';
import { normalizeHunts, normalizeCatches, normalizeLists, normalizeHunt } from '../state/persistence.js';
import { uid } from '../lib/utils.js';

export const APP_ID = 'shiny-hunter-pro';

export const buildExport = ({ catches, hunts, wishlist, lists, settings }) => ({
  app: APP_ID,
  version: 3,
  exportedAt: new Date().toISOString(),
  catches,
  hunts: hunts.map(h => ({ ...h, startedAt: null })),
  wishlist,
  lists,
  settings
});

// Accepte le format v3, v2 ({ shinies }), v1 ({ shinyState, hunts }) et le format compact des QR codes / liens.
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
  if (data.c === 3) data = expandCompact(data);
  const hasCatches = data.catches || data.shinies || data.shinyState;
  const catches = normalizeCatches(data.catches || data.shinies || data.shinyState);
  const hunts = normalizeHunts(data.hunts);
  const wishlist = data.wishlist && typeof data.wishlist === 'object' ? data.wishlist : {};
  const lists = normalizeLists(data.lists);
  if (!hasCatches && !hunts.length && !Object.keys(wishlist).length && !lists.length) throw new Error('Aucune donnée trouvée');
  return { catches, hunts, wishlist, lists, settings: data.settings };
}

// Fusion : pour chaque élément (même identifiant), la version modifiée le plus récemment gagne.
const mergeById = (mine, theirs) => {
  const map = new Map(mine.map(x => [x.id, x]));
  for (const t of theirs) {
    const m = map.get(t.id);
    if (!m || (t.updatedAt || 0) > (m.updatedAt || 0)) map.set(t.id, m?.startedAt && !t.startedAt ? { ...t, startedAt: m.startedAt } : t);
  }
  return [...map.values()];
};

export function mergeData(current, incoming) {
  // Les anciens formats n'ont pas d'identifiant de capture : on évite les doublons (même Pokémon, même date).
  const sig = c => `${c.key}|${c.date}|${c.ball}|${c.count}`;
  const existing = new Set(current.catches.map(sig));
  const incomingCatches = incoming.catches.filter(c => current.catches.some(m => m.id === c.id) || !existing.has(sig(c)));
  return {
    catches: mergeById(current.catches, incomingCatches),
    hunts: mergeById(current.hunts, incoming.hunts),
    wishlist: { ...current.wishlist, ...incoming.wishlist },
    lists: mergeById(current.lists, incoming.lists)
  };
}

// Format compact : suffisamment petit pour tenir dans un QR code (sans les notes).
export function encodeCompact({ catches, hunts, wishlist, lists }) {
  const compact = {
    c: 3,
    s: catches.map(r => {
      const row = [r.key, r.date ? Number(r.date.replace(/-/g, '')) : 0, r.method, r.ball, r.game || '', r.count || 0, r.odds || 0, Math.round((r.elapsedMs || 0) / 1000), r.id];
      if (r.nickname) row.push(r.nickname);
      return row;
    }),
    h: hunts.filter(h => h.status === 'active').map(h => [h.targetId, h.game, h.method, h.opts, h.charm ? 1 : 0, h.customOdds || 0, h.count, Math.round(h.elapsedMs / 1000), h.step, h.id]),
    w: Object.keys(wishlist).filter(k => wishlist[k]),
    l: lists.map(l => [l.id, l.name, l.emoji, Object.keys(l.keys).filter(k => l.keys[k])])
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(compact));
}

export function decodeCompact(str) {
  const json = LZString.decompressFromEncodedURIComponent(str);
  if (!json) throw new Error('Code illisible');
  return JSON.parse(json);
}

function expandCompact(c) {
  const catches = (c.s || []).map(([key, date, method, ball, game, count, odds, secs, id, nickname]) => {
    const d = String(date || '');
    const iso = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : '';
    return { id, key, date: iso, method, ball, game, count, odds, elapsedMs: secs * 1000, nickname: nickname || '' };
  });
  const hunts = (c.h || []).map(([targetId, game, method, opts, charm, customOdds, count, secs, step, id]) => normalizeHunt({
    id: id || uid(), targetId, game, method, opts: opts || {}, charm: !!charm, customOdds: customOdds || null, count,
    elapsedMs: secs * 1000, step, updatedAt: Date.now()
  }));
  const wishlist = Object.fromEntries((c.w || []).map(k => [k, true]));
  const lists = (c.l || []).map(([id, name, emoji, keys]) => ({ id, name, emoji, keys: Object.fromEntries(keys.map(k => [k, true])) }));
  return { catches, hunts, wishlist, lists };
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
