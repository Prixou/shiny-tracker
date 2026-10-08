// État global de l'application (sans React) : données, réglages, interface, annulation et actions.
// Les composants s'y abonnent par sélecteur (voir StoreProvider.jsx) : seuls ceux dont la tranche
// change sont rendus à nouveau.
import { createStore } from 'zustand/vanilla';
import { createCatch, groupByKey, latestByKey } from '../domain/catch.js';
import { createHunt, huntChance, huntElapsed, huntOdds, huntTotal, pauseHunt } from '../domain/hunt.js';
import { createList, setKeys } from '../domain/lists.js';
import { DEFAULT_SETTINGS } from '../domain/settings.js';
import { mergeData } from '../domain/backup.js';
import { luckRatio } from '../data/methods.js';
import { MAIN_DEX } from '../data/pokedex.js';
import { uid } from '../lib/id.js';

// Tranches de données synchronisées (horodatées à chaque modification) et annulables.
export const DATA_SLICES = ['catches', 'hunts', 'wishlist', 'lists'];
const UNDO_LIMIT = 25;

/* ---------- Sélecteurs dérivés (mémorisés sur la référence des captures) ---------- */
const memoByRef = fn => {
  let lastArg;
  let lastResult;
  return arg => (arg === lastArg ? lastResult : (lastResult = fn((lastArg = arg))));
};
const shiniesOf = memoByRef(latestByKey);
const byKeyOf = memoByRef(groupByKey);

/** Dernière capture de chaque espèce : { clé: capture }. */
export const selectShinies = s => shiniesOf(s.catches);
/** Exemplaires de chaque espèce : { clé: [captures] }. */
export const selectCatchesByKey = s => byKeyOf(s.catches);
const caughtCountOf = memoByRef(shinies => MAIN_DEX.reduce((n, p) => n + (shinies[p.key] ? 1 : 0), 0));
/** Nombre d'espèces et formes régionales capturées (hors variantes). */
export const selectCaughtCount = s => caughtCountOf(selectShinies(s));
/** Données et dérivés, pour les traitements hors React (assistant, export). */
export const selectSnapshot = s => ({
  catches: s.catches, hunts: s.hunts, wishlist: s.wishlist, lists: s.lists, settings: s.settings, ui: s.ui,
  shinies: selectShinies(s), catchesByKey: selectCatchesByKey(s)
});

/* ---------- Annulation ---------- */
// Chaque entrée mémorise l'état « avant » des seuls éléments touchés, pour ne rien écraser d'autre.
// `touched` : { tranche: [identifiants] | 'all' } (pour wishlist, les identifiants sont des clés).
function snapshot(state, touched) {
  const before = {};
  for (const [slice, ids] of Object.entries(touched)) {
    const current = state[slice];
    if (ids === 'all') before[slice] = { all: current };
    else if (slice === 'wishlist') before[slice] = ids.map(k => [k, current[k] || null]);
    else before[slice] = ids.map(id => [id, current.find(x => x.id === id) || null]);
  }
  return before;
}

function restoreSlice(slice, current, before) {
  if (before.all) return before.all;
  if (slice === 'wishlist') {
    const next = { ...current };
    for (const [k, v] of before) { if (v) next[k] = v; else delete next[k]; }
    return next;
  }
  let next = [...current];
  for (const [id, value] of before) {
    const i = next.findIndex(x => x.id === id);
    if (!value) { if (i >= 0) next.splice(i, 1); } else if (i >= 0) next[i] = value; else next = [value, ...next];
  }
  return next;
}

/** Chasses dont le chrono tournait à la fermeture : le temps est compté jusqu'à leur dernière modification. */
const pauseOnStart = hunts => hunts.map(h => (h.startedAt ? { ...h, elapsedMs: h.elapsedMs + Math.max(0, (h.updatedAt || h.startedAt) - h.startedAt), startedAt: null } : h));

/**
 * Crée le store. `initial` : { catches, hunts, wishlist, lists, settings, ui, stamp } (voir loadState).
 * `now` : horloge injectable pour les tests ; `onReset` : appelé quand l'utilisateur efface tout.
 */
export function createAppStore(initial = {}, { now = () => Date.now(), onReset = () => {} } = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...(initial.settings || {}) };
  const hunts = initial.hunts || [];

  return createStore((set, get) => {
    // Modifie des données : horodatage pour la synchro et, si `label`, entrée d'annulation (dans le même rendu).
    const commit = (label, touched, update) => set(s => {
      const patch = typeof update === 'function' ? update(s) : update;
      const undoStack = label
        ? [...s.undoStack.slice(-(UNDO_LIMIT - 1)), { id: uid(), label, before: snapshot(s, touched), at: now() }]
        : s.undoStack;
      return { ...patch, undoStack, stamp: now() };
    });
    const mapHunt = (id, fn) => s => ({ hunts: s.hunts.map(h => (h.id === id ? { ...h, ...fn(h), updatedAt: now() } : h)) });
    const dropWish = (wishlist, key) => {
      if (!wishlist[key]) return wishlist;
      const next = { ...wishlist };
      delete next[key];
      return next;
    };

    const actions = {
      setSettings: patch => set(s => ({ settings: { ...s.settings, ...patch } })),
      setUiValue: (key, value) => set(s => ({ ui: { ...s.ui, [key]: value } })),

      /** Annule la dernière action et la renvoie (null si rien à annuler). */
      undo() {
        const entry = get().undoStack.at(-1);
        if (!entry) return null;
        set(s => {
          const patch = {};
          for (const [slice, before] of Object.entries(entry.before)) patch[slice] = restoreSlice(slice, s[slice], before);
          return { ...patch, undoStack: s.undoStack.slice(0, -1), stamp: now() };
        });
        return entry;
      },

      /* ---------- Captures ---------- */
      addCatch(key, extra = {}, label = 'Capture ajoutée') {
        const c = createCatch(key, extra, get().settings, now());
        commit(label, { catches: [c.id], wishlist: [c.key] }, s => ({ catches: [c, ...s.catches], wishlist: dropWish(s.wishlist, c.key) }));
        return c.id;
      },
      updateCatch(id, patch) {
        commit(null, null, s => ({ catches: s.catches.map(c => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)) }));
      },
      removeCatch(id, label = 'Capture supprimée') {
        commit(label, { catches: [id] }, s => ({ catches: s.catches.filter(c => c.id !== id) }));
      },
      removeCatchesOf(key, label = 'Captures retirées') {
        const ids = get().catches.filter(c => c.key === key).map(c => c.id);
        commit(label, { catches: ids }, s => ({ catches: s.catches.filter(c => c.key !== key) }));
      },
      /** Marque des captures comme transférées dans Pokémon HOME (une seule entrée d'annulation). */
      markInHome(ids, on) {
        if (!ids.length) return;
        const set_ = new Set(ids);
        commit(on ? 'Marqué comme transféré dans HOME' : 'Marque HOME retirée', { catches: ids }, s => ({
          catches: s.catches.map(c => {
            if (!set_.has(c.id)) return c;
            const next = { ...c, updatedAt: now() };
            if (on) next.inHome = true; else delete next.inHome;
            return next;
          })
        }));
      },

      /* ---------- Objectifs et listes ---------- */
      toggleWish(key) {
        commit('Objectifs modifiés', { wishlist: [key] }, s => ({ wishlist: setKeys(s.wishlist, [key], !s.wishlist[key]) }));
      },
      setWishes(keys, on) {
        commit(on ? 'Objectifs ajoutés' : 'Objectifs retirés', { wishlist: keys }, s => ({ wishlist: setKeys(s.wishlist, keys, on) }));
      },
      createList(fields) {
        const list = createList(fields, now());
        commit(`Liste « ${list.name} » créée`, { lists: [list.id] }, s => ({ lists: [...s.lists, list] }));
        return list.id;
      },
      updateList(id, patch) {
        commit(null, null, s => ({ lists: s.lists.map(l => (l.id === id ? { ...l, ...patch, updatedAt: now() } : l)) }));
      },
      deleteList(id) {
        const list = get().lists.find(l => l.id === id);
        commit(`Liste « ${list?.name || ''} » supprimée`, { lists: [id] }, s => ({ lists: s.lists.filter(l => l.id !== id) }));
      },
      setInList(listId, keys, on, label = 'Liste modifiée') {
        commit(label, { lists: [listId] }, s => ({
          lists: s.lists.map(l => (l.id === listId ? { ...l, keys: setKeys(l.keys, keys, on), updatedAt: now() } : l))
        }));
      },
      toggleInList(listId, key) {
        const list = get().lists.find(l => l.id === listId);
        if (list) actions.setInList(listId, [key], !list.keys[key]);
      },

      /* ---------- Chasses ---------- */
      createHunt(fields) {
        const hunt = createHunt(fields, { defaultGame: get().settings.defaultGame, now: now() });
        commit('Chasse créée', { hunts: [hunt.id] }, s => ({ hunts: [hunt, ...s.hunts], ui: { ...s.ui, activeHuntId: hunt.id } }));
        return hunt.id;
      },
      updateHunt(id, patch, undoLabel = null) {
        commit(undoLabel, { hunts: [id] }, mapHunt(id, h => (typeof patch === 'function' ? patch(h) : patch)));
      },
      increment(id, delta) {
        actions.updateHunt(id, h => ({ count: Math.max(0, h.count + delta), startedAt: delta > 0 && !h.startedAt ? now() : h.startedAt }));
      },
      toggleTimer(id) {
        actions.updateHunt(id, h => (h.startedAt ? { elapsedMs: huntElapsed(h, now()), startedAt: null } : { startedAt: now() }));
      },
      setElapsed(id, ms) {
        actions.updateHunt(id, h => ({ elapsedMs: Math.max(0, ms), startedAt: h.startedAt ? now() : null }));
      },
      addPhase(id, { key = '', note = '' } = {}, label = 'Phase ajoutée') {
        actions.updateHunt(id, h => ({ phases: [...h.phases, { count: h.count, at: now(), key, note }], count: 0 }), label);
      },
      removePhase(id, index) {
        actions.updateHunt(id, h => ({ phases: h.phases.filter((_, i) => i !== index) }), 'Phase supprimée');
      },
      /** Termine la chasse et enregistre la capture ; renvoie la capture. */
      finishHunt(id, details = {}) {
        const h = get().hunts.find(x => x.id === id);
        if (!h) return null;
        const t = now();
        const done = pauseHunt(h, t);
        const c = createCatch(h.targetId, {
          method: h.method, opts: h.opts, game: h.game, count: huntTotal(h), elapsedMs: done.elapsedMs,
          odds: Math.round(huntOdds(h)), luck: luckRatio(huntChance(h)), phases: h.phases.length, huntId: h.id, timestamp: t, ...details
        }, get().settings, t);
        commit('Capture enregistrée', { hunts: [id], catches: [c.id], wishlist: [h.targetId] }, s => ({
          catches: [c, ...s.catches],
          hunts: s.hunts.map(x => (x.id === id ? { ...pauseHunt(x, t), status: 'done', finishedAt: t, updatedAt: t } : x)),
          wishlist: dropWish(s.wishlist, h.targetId)
        }));
        return c;
      },
      resumeHunt(id) {
        actions.updateHunt(id, { status: 'active', finishedAt: null }, 'Chasse reprise');
        actions.setUiValue('activeHuntId', id);
      },
      deleteHunt(id) {
        commit('Chasse supprimée', { hunts: [id] }, s => ({ hunts: s.hunts.filter(h => h.id !== id) }));
      },
      /** Met en pause tous les chronos (application en arrière-plan). */
      pauseAll() {
        if (!get().hunts.some(h => h.startedAt)) return;
        const t = now();
        set(s => ({ hunts: s.hunts.map(h => pauseHunt(h, t)), stamp: t }));
      },

      /* ---------- Sauvegardes et synchronisation ---------- */
      importData(incoming, mode = 'merge') {
        const all = Object.fromEntries(DATA_SLICES.map(k => [k, 'all']));
        commit('Import de données', all, s => {
          const next = mode === 'replace'
            ? { catches: incoming.catches, hunts: incoming.hunts, wishlist: incoming.wishlist || {}, lists: incoming.lists || [] }
            : mergeData(s, incoming);
          return mode === 'replace' && incoming.settings ? { ...next, settings: { ...s.settings, ...incoming.settings } } : next;
        });
      },
      /** Remplacement silencieux par la synchronisation cloud (sans annulation) ; renvoie le nouvel horodatage. */
      replaceData(doc) {
        commit(null, null, s => ({
          catches: doc.catches,
          // Un chrono en cours sur cet appareil continue.
          hunts: doc.hunts.map(h => {
            const mine = s.hunts.find(x => x.id === h.id);
            return mine?.startedAt && !h.startedAt ? { ...h, startedAt: mine.startedAt } : h;
          }),
          wishlist: doc.wishlist || {},
          lists: doc.lists || []
        }));
        return get().stamp;
      },
      resetAll() {
        onReset();
        const all = Object.fromEntries(DATA_SLICES.map(k => [k, 'all']));
        commit('Données effacées', all, { catches: [], hunts: [], wishlist: {}, lists: [], settings: DEFAULT_SETTINGS, ui: { tab: 'dex' } });
      }
    };

    return {
      catches: initial.catches || [],
      hunts: settings.autoPause ? pauseOnStart(hunts) : hunts,
      wishlist: initial.wishlist || {},
      lists: initial.lists || [],
      settings,
      ui: initial.ui || {},
      // Horodatage de la dernière modification des données (utilisé par la synchronisation cloud).
      stamp: initial.stamp || 0,
      undoStack: [],
      actions
    };
  });
}
