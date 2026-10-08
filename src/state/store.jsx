import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, persist, clearAll, DEFAULT_SETTINGS } from '../lib/storage.js';
import { mergeData } from '../lib/sync.js';
import { GAME_BY_ID } from '../data/constants.js';
import { oddsAt, cumulativeChance, luckRatio, oddsContext, probAt } from '../data/methods.js';
import { todayIso, uid } from '../lib/utils.js';
import { feedback } from '../lib/hooks.js';
import { hasCharm } from '../lib/myGames.js';

const StoreContext = createContext(null);

export const huntElapsed = (h, now = Date.now()) => h.elapsedMs + (h.startedAt ? Math.max(0, now - h.startedAt) : 0);
export const huntTotal = h => h.count + h.phases.reduce((sum, p) => sum + (p.count || 0), 0);
export const huntSegments = h => [...h.phases.map(p => p.count || 0), h.count];
export const huntChance = h => cumulativeChance(h, huntSegments(h));
export const huntOdds = h => 1 / probAt(oddsContext(h), h.count);

export const defaultMethodFor = gameId => {
  const methods = GAME_BY_ID[gameId]?.methods || ['wild'];
  return methods[0];
};

const pauseHunt = (h, now = Date.now()) => (h.startedAt ? { ...h, elapsedMs: huntElapsed(h, now), startedAt: null } : h);
const DATA_SLICES = ['catches', 'hunts', 'lists', 'wishlist'];

function useSaved(key, value) {
  const first = useRef(true);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => persist(key, value), 250);
    return () => clearTimeout(t);
  }, [key, value]);
  // Sauvegarde immédiate si l'app passe en arrière-plan.
  useEffect(() => {
    const flush = () => { if (document.visibilityState === 'hidden') persist(key, latest.current); };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [key]);
}

export function StoreProvider({ children }) {
  const initial = useMemo(() => loadState(), []);
  const [catches, setCatches] = useState(initial.catches);
  const [hunts, setHunts] = useState(() => (initial.settings.autoPause
    ? initial.hunts.map(h => (h.startedAt ? { ...h, elapsedMs: h.elapsedMs + Math.max(0, (h.updatedAt || h.startedAt) - h.startedAt), startedAt: null } : h))
    : initial.hunts));
  const [wishlist, setWishlist] = useState(initial.wishlist);
  const [lists, setLists] = useState(initial.lists);
  const [settings, setSettingsState] = useState(initial.settings);
  const [ui, setUi] = useState(initial.ui);
  const [undoStack, setUndoStack] = useState([]);
  // Horodatage de la dernière modification des données (utilisé par la synchronisation cloud).
  const [dataStamp, setDataStamp] = useState(initial.stamp);

  useSaved('catches', catches);
  useSaved('hunts', hunts);
  useSaved('wishlist', wishlist);
  useSaved('lists', lists);
  useSaved('settings', settings);
  useSaved('ui', ui);
  useSaved('stamp', dataStamp);

  const data = useRef();
  data.current = { catches, hunts, wishlist, lists };
  const skipStamp = useRef(true);
  useEffect(() => {
    if (skipStamp.current) { skipStamp.current = false; return; }
    setDataStamp(Date.now());
  }, [catches, hunts, wishlist, lists]);

  useEffect(() => {
    feedback.enabledHaptics = settings.haptics;
    feedback.enabledSound = settings.sound;
  }, [settings.haptics, settings.sound]);

  // Pause automatique des chronomètres quand l'application passe en arrière-plan.
  useEffect(() => {
    if (!settings.autoPause) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        setHunts(prev => (prev.some(h => h.startedAt) ? prev.map(h => pauseHunt(h)) : prev));
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [settings.autoPause]);

  const shinies = useMemo(() => {
    const map = {};
    for (const c of catches) if (!map[c.key] || c.timestamp > map[c.key].timestamp) map[c.key] = c;
    return map;
  }, [catches]);
  const catchesByKey = useMemo(() => {
    const map = {};
    for (const c of catches) (map[c.key] ||= []).push(c);
    Object.values(map).forEach(arr => arr.sort((a, b) => b.timestamp - a.timestamp));
    return map;
  }, [catches]);

  /* ---------- Annulation ---------- */
  // Chaque entrée mémorise l'état « avant » des seuls éléments touchés, pour ne rien écraser d'autre.
  const pushUndo = useCallback((label, touched) => {
    const before = {};
    for (const slice of Object.keys(touched)) {
      const ids = touched[slice];
      const current = data.current[slice];
      if (ids === 'all') before[slice] = 'all:' + JSON.stringify(current);
      else if (slice === 'wishlist') before[slice] = ids.map(k => [k, current[k] || null]);
      else before[slice] = ids.map(id => [id, current.find(x => x.id === id) || null]);
    }
    setUndoStack(s => [...s.slice(-24), { id: uid(), label, before, at: Date.now() }]);
  }, []);

  const restore = useCallback(entry => {
    const setters = { catches: setCatches, hunts: setHunts, lists: setLists, wishlist: setWishlist };
    for (const [slice, before] of Object.entries(entry.before)) {
      if (typeof before === 'string') { setters[slice](JSON.parse(before.slice(4))); continue; }
      if (slice === 'wishlist') {
        setWishlist(prev => {
          const next = { ...prev };
          for (const [k, v] of before) { if (v) next[k] = v; else delete next[k]; }
          return next;
        });
        continue;
      }
      setters[slice](prev => {
        let next = [...prev];
        for (const [id, value] of before) {
          const i = next.findIndex(x => x.id === id);
          if (!value) { if (i >= 0) next.splice(i, 1); } else if (i >= 0) next[i] = value; else next = [value, ...next];
        }
        return next;
      });
    }
  }, []);

  const undoRef = useRef(undoStack);
  undoRef.current = undoStack;
  const undo = useCallback(() => {
    const entry = undoRef.current[undoRef.current.length - 1];
    if (!entry) return null;
    undoRef.current = undoRef.current.slice(0, -1);
    setUndoStack(s => s.filter(e => e.id !== entry.id));
    restore(entry);
    feedback.undo();
    return entry;
  }, [restore]);

  const setSettings = useCallback(patch => setSettingsState(s => ({ ...s, ...patch })), []);
  const setUiValue = useCallback((key, value) => setUi(u => ({ ...u, [key]: value })), []);

  const updateHunt = useCallback((id, patch, undoLabel) => {
    if (undoLabel) pushUndo(undoLabel, { hunts: [id] });
    setHunts(prev => prev.map(h => (h.id === id ? { ...h, ...(typeof patch === 'function' ? patch(h) : patch), updatedAt: Date.now() } : h)));
  }, [pushUndo]);

  const actions = useMemo(() => {
    const newCatch = (key, extra = {}) => {
      const game = extra.game ?? settings.defaultGame ?? 'sv';
      const method = extra.method || defaultMethodFor(game);
      const now = Date.now();
      return {
        id: uid(), key: String(key), date: todayIso(), timestamp: now, method, opts: {}, ball: 'pokeball', game,
        count: 0, elapsedMs: 0, odds: Math.round(oddsAt({ game, method, charm: hasCharm(settings, game), opts: extra.opts || {} })), luck: null,
        phases: 0, nickname: '', gender: '', notes: '', huntId: null, updatedAt: now, ...extra
      };
    };
    const dropWish = key => setWishlist(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    return {
      setSettings,
      setUiValue,
      undo,
      pushUndo,

      addCatch(key, extra = {}, label) {
        const c = newCatch(key, extra);
        pushUndo(label || 'Capture ajoutée', { catches: [c.id], wishlist: [String(key)] });
        setCatches(prev => [c, ...prev]);
        dropWish(String(key));
        return c.id;
      },
      // Marque des captures comme transférées dans Pokémon HOME (une seule entrée d'annulation).
      markInHome(ids, on) {
        if (!ids.length) return;
        pushUndo(on ? 'Marqué comme transféré dans HOME' : 'Marque HOME retirée', { catches: ids });
        const set = new Set(ids);
        const now = Date.now();
        setCatches(prev => prev.map(c => {
          if (!set.has(c.id)) return c;
          const next = { ...c, updatedAt: now };
          if (on) next.inHome = true; else delete next.inHome;
          return next;
        }));
      },
      updateCatch(id, patch) {
        setCatches(prev => prev.map(c => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)));
      },
      removeCatch(id, label = 'Capture supprimée') {
        pushUndo(label, { catches: [id] });
        setCatches(prev => prev.filter(c => c.id !== id));
      },
      removeCatchesOf(key, label = 'Captures retirées') {
        const ids = data.current.catches.filter(c => c.key === key).map(c => c.id);
        pushUndo(label, { catches: ids });
        setCatches(prev => prev.filter(c => c.key !== key));
      },

      toggleWish(key) {
        pushUndo('Objectifs modifiés', { wishlist: [key] });
        setWishlist(prev => {
          const next = { ...prev };
          if (next[key]) delete next[key]; else next[key] = true;
          return next;
        });
      },
      // Versions groupées (une seule entrée d'annulation), utilisées par l'assistant.
      setWishes(keys, on) {
        pushUndo(on ? 'Objectifs ajoutés' : 'Objectifs retirés', { wishlist: keys });
        setWishlist(prev => {
          const next = { ...prev };
          keys.forEach(k => { if (on) next[k] = true; else delete next[k]; });
          return next;
        });
      },
      setInList(listId, keys, on) {
        pushUndo('Liste modifiée', { lists: [listId] });
        setLists(prev => prev.map(l => {
          if (l.id !== listId) return l;
          const next = { ...l.keys };
          keys.forEach(k => { if (on) next[k] = true; else delete next[k]; });
          return { ...l, keys: next, updatedAt: Date.now() };
        }));
      },
      createList({ name, emoji = '📌', keys = {} }) {
        const list = { id: uid(), name: name.trim().slice(0, 40) || 'Nouvelle liste', emoji, keys, updatedAt: Date.now() };
        pushUndo(`Liste « ${list.name} » créée`, { lists: [list.id] });
        setLists(prev => [...prev, list]);
        return list.id;
      },
      updateList(id, patch) {
        setLists(prev => prev.map(l => (l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l)));
      },
      deleteList(id) {
        const list = data.current.lists.find(l => l.id === id);
        pushUndo(`Liste « ${list?.name || ''} » supprimée`, { lists: [id] });
        setLists(prev => prev.filter(l => l.id !== id));
      },
      toggleInList(listId, key) {
        pushUndo('Liste modifiée', { lists: [listId] });
        setLists(prev => prev.map(l => {
          if (l.id !== listId) return l;
          const keys = { ...l.keys };
          if (keys[key]) delete keys[key]; else keys[key] = true;
          return { ...l, keys, updatedAt: Date.now() };
        }));
      },

      createHunt({ targetId, game, method, opts = {}, charm, customOdds = null, step, count = 0 }) {
        const id = uid();
        const g = game || settings.defaultGame;
        const m = method || defaultMethodFor(g);
        const hunt = {
          id, targetId: String(targetId), game: g, method: m, opts, charm: !!charm, customOdds: Number(customOdds) || null,
          count: Math.max(0, Number(count) || 0), step: Math.max(1, Number(step) || 1),
          phases: [], elapsedMs: 0, startedAt: null, status: 'active',
          createdAt: Date.now(), updatedAt: Date.now(), finishedAt: null, notes: ''
        };
        pushUndo('Chasse créée', { hunts: [id] });
        setHunts(prev => [hunt, ...prev]);
        setUiValue('activeHuntId', id);
        return id;
      },
      updateHunt,
      increment(id, delta) {
        updateHunt(id, h => ({
          count: Math.max(0, h.count + delta),
          startedAt: delta > 0 && !h.startedAt ? Date.now() : h.startedAt
        }));
      },
      toggleTimer(id) {
        updateHunt(id, h => (h.startedAt ? { elapsedMs: huntElapsed(h), startedAt: null } : { startedAt: Date.now() }));
      },
      setElapsed(id, ms) {
        updateHunt(id, h => ({ elapsedMs: Math.max(0, ms), startedAt: h.startedAt ? Date.now() : null }));
      },
      addPhase(id, { key = '', note = '' } = {}) {
        updateHunt(id, h => ({ phases: [...h.phases, { count: h.count, at: Date.now(), key, note }], count: 0 }), 'Phase ajoutée');
      },
      removePhase(id, index) {
        updateHunt(id, h => ({ phases: h.phases.filter((_, i) => i !== index) }), 'Phase supprimée');
      },
      finishHunt(id, details) {
        const h = data.current.hunts.find(x => x.id === id);
        if (!h) return null;
        const now = Date.now();
        const done = pauseHunt(h, now);
        const chance = huntChance(h);
        const c = newCatch(h.targetId, {
          method: h.method, opts: h.opts, game: h.game, count: huntTotal(h), elapsedMs: done.elapsedMs,
          odds: Math.round(huntOdds(h)), luck: luckRatio(chance), phases: h.phases.length, huntId: h.id, timestamp: now, ...details
        });
        pushUndo('Capture enregistrée', { hunts: [id], catches: [c.id], wishlist: [h.targetId] });
        setCatches(prev => [c, ...prev]);
        setHunts(prev => prev.map(x => (x.id === id ? { ...pauseHunt(x, now), status: 'done', finishedAt: now, updatedAt: now } : x)));
        dropWish(h.targetId);
        return c;
      },
      resumeHunt(id) {
        updateHunt(id, { status: 'active', finishedAt: null }, 'Chasse reprise');
        setUiValue('activeHuntId', id);
      },
      deleteHunt(id) {
        pushUndo('Chasse supprimée', { hunts: [id] });
        setHunts(prev => prev.filter(h => h.id !== id));
      },
      importData(incoming, mode = 'merge') {
        pushUndo('Import de données', { catches: 'all', hunts: 'all', wishlist: 'all', lists: 'all' });
        const next = mode === 'replace'
          ? { catches: incoming.catches, hunts: incoming.hunts, wishlist: incoming.wishlist || {}, lists: incoming.lists || [] }
          : mergeData(data.current, incoming);
        setCatches(next.catches);
        setHunts(next.hunts);
        setWishlist(next.wishlist);
        setLists(next.lists);
        if (incoming.settings && mode === 'replace') setSettingsState(s => ({ ...s, ...incoming.settings }));
      },
      // Remplacement silencieux par la synchronisation cloud (sans entrée d'annulation).
      replaceData(doc) {
        setCatches(doc.catches);
        setHunts(prev => doc.hunts.map(h => {
          const mine = prev.find(x => x.id === h.id);
          return mine?.startedAt && !h.startedAt ? { ...h, startedAt: mine.startedAt } : h;
        }));
        setWishlist(doc.wishlist || {});
        setLists(doc.lists || []);
      },
      resetAll() {
        pushUndo('Données effacées', { catches: 'all', hunts: 'all', wishlist: 'all', lists: 'all' });
        const keepUi = { tab: 'dex' };
        clearAll();
        setCatches([]);
        setHunts([]);
        setWishlist({});
        setLists([]);
        setSettingsState(DEFAULT_SETTINGS);
        setUi(keepUi);
      }
    };
  }, [settings, setSettings, setUiValue, updateHunt, pushUndo, undo]);

  const value = useMemo(() => ({
    catches, shinies, catchesByKey, hunts, wishlist, lists, settings, ui, undoStack, dataStamp, ...actions
  }), [catches, shinies, catchesByKey, hunts, wishlist, lists, settings, ui, undoStack, dataStamp, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
export { DATA_SLICES };
