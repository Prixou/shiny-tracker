import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, persist, clearAll, DEFAULT_SETTINGS } from '../lib/storage.js';
import { mergeData } from '../lib/sync.js';
import { methodOdds } from '../data/constants.js';
import { todayIso, uid } from '../lib/utils.js';
import { feedback } from '../lib/hooks.js';

const StoreContext = createContext(null);

export const huntElapsed = (h, now = Date.now()) => h.elapsedMs + (h.startedAt ? Math.max(0, now - h.startedAt) : 0);
export const huntTotal = h => h.count + h.phases.reduce((sum, p) => sum + (p.count || 0), 0);

const pauseHunt = (h, now = Date.now()) => (h.startedAt ? { ...h, elapsedMs: huntElapsed(h, now), startedAt: null } : h);

function useSaved(key, value) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => persist(key, value), 250);
    return () => clearTimeout(t);
  }, [key, value]);
  // Sauvegarde immédiate si l'app passe en arrière-plan.
  const latest = useRef(value);
  latest.current = value;
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
  const [shinies, setShinies] = useState(initial.shinies);
  const [hunts, setHunts] = useState(() => initial.settings.autoPause
    ? initial.hunts.map(h => (h.startedAt ? { ...h, elapsedMs: h.elapsedMs + Math.max(0, (h.updatedAt || h.startedAt) - h.startedAt), startedAt: null } : h))
    : initial.hunts);
  const [wishlist, setWishlist] = useState(initial.wishlist);
  const [settings, setSettingsState] = useState(initial.settings);
  const [ui, setUi] = useState(initial.ui);

  useSaved('shinies', shinies);
  useSaved('hunts', hunts);
  useSaved('wishlist', wishlist);
  useSaved('settings', settings);
  useSaved('ui', ui);

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

  const setSettings = useCallback(patch => setSettingsState(s => ({ ...s, ...patch })), []);
  const setUiValue = useCallback((key, value) => setUi(u => ({ ...u, [key]: value })), []);

  const updateHunt = useCallback((id, patch) => {
    setHunts(prev => prev.map(h => (h.id === id ? { ...h, ...(typeof patch === 'function' ? patch(h) : patch), updatedAt: Date.now() } : h)));
  }, []);

  const actions = useMemo(() => ({
    setSettings,
    setUiValue,

    markCaught(key, extra = {}) {
      setShinies(prev => ({
        ...prev,
        [key]: {
          caught: true,
          date: todayIso(),
          timestamp: Date.now(),
          method: settings.defaultMethod || 'wild',
          ball: 'pokeball',
          game: settings.defaultGame || '',
          count: 0,
          elapsedMs: 0,
          odds: methodOdds(settings.defaultMethod || 'wild', settings.charm),
          phases: 0,
          nickname: '',
          gender: '',
          notes: '',
          huntId: null,
          ...extra
        }
      }));
      setWishlist(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    updateShiny(key, patch) {
      setShinies(prev => (prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev));
    },
    removeShiny(key) {
      setShinies(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    toggleWish(key) {
      setWishlist(prev => {
        const next = { ...prev };
        if (next[key]) delete next[key]; else next[key] = true;
        return next;
      });
    },

    createHunt({ targetId, game, method, charm, odds, step = 1, count = 0 }) {
      const id = uid();
      const hunt = {
        id,
        targetId: String(targetId),
        game: game || settings.defaultGame,
        method: method || 'wild',
        charm: !!charm,
        odds: Number(odds) || methodOdds(method, charm),
        count: Math.max(0, Number(count) || 0),
        step: Math.max(1, Number(step) || 1),
        phases: [],
        elapsedMs: 0,
        startedAt: null,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        finishedAt: null,
        notes: ''
      };
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
      updateHunt(id, h => ({ phases: [...h.phases, { count: h.count, at: Date.now(), key, note }], count: 0 }));
    },
    removePhase(id, index) {
      updateHunt(id, h => ({ phases: h.phases.filter((_, i) => i !== index) }));
    },
    finishHunt(id, details) {
      const h = hunts.find(x => x.id === id);
      if (!h) return;
      const now = Date.now();
      const done = pauseHunt(h, now);
      setShinies(s => ({
        ...s,
        [h.targetId]: {
          caught: true,
          date: todayIso(),
          timestamp: now,
          method: h.method,
          ball: 'pokeball',
          game: h.game,
          count: huntTotal(h),
          elapsedMs: done.elapsedMs,
          odds: h.odds,
          phases: h.phases.length,
          nickname: '',
          gender: '',
          notes: '',
          huntId: h.id,
          ...details
        }
      }));
      setHunts(prev => prev.map(x => (x.id === id ? { ...pauseHunt(x, now), status: 'done', finishedAt: now, updatedAt: now } : x)));
      setWishlist(prev => {
        if (!prev[h.targetId]) return prev;
        const next = { ...prev };
        delete next[h.targetId];
        return next;
      });
    },
    resumeHunt(id) {
      updateHunt(id, { status: 'active', finishedAt: null });
      setUiValue('activeHuntId', id);
    },
    deleteHunt(id) {
      setHunts(prev => prev.filter(h => h.id !== id));
    },
    importData(incoming, mode = 'merge') {
      if (mode === 'replace') {
        setShinies(incoming.shinies);
        setHunts(incoming.hunts);
        setWishlist(incoming.wishlist || {});
      } else {
        const merged = mergeData({ shinies, hunts, wishlist }, incoming);
        setShinies(merged.shinies);
        setHunts(merged.hunts);
        setWishlist(merged.wishlist);
      }
      if (incoming.settings && mode === 'replace') setSettingsState(s => ({ ...s, ...incoming.settings }));
    },
    resetAll() {
      clearAll();
      setShinies({});
      setHunts([]);
      setWishlist({});
      setSettingsState(DEFAULT_SETTINGS);
      setUi({});
    }
  }), [settings.defaultGame, settings.defaultMethod, settings.charm, setSettings, setUiValue, updateHunt, shinies, hunts, wishlist]);

  const value = useMemo(() => ({ shinies, hunts, wishlist, settings, ui, ...actions }),
    [shinies, hunts, wishlist, settings, ui, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
