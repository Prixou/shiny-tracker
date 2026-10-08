import { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
/** @import { AppState, AppStore, Actions } from './store.js' */
import { createAppStore, selectCatchesByKey, selectShinies } from './store.js';
import { attachPersistence, clearAll, loadState } from './persistence.js';
import { feedback } from '../lib/feedback.js';

const StoreContext = createContext(null);

/** Fournit le store (créé depuis le stockage local) et gère sauvegarde, pause auto et retours tactiles. */
export function StoreProvider({ children, store: provided = null }) {
  const [store] = useState(() => provided || createAppStore(loadState(), { onReset: clearAll }));

  useEffect(() => {
    const { flush, detach } = attachPersistence(store);
    const applyFeedback = ({ settings }) => {
      feedback.enabledHaptics = settings.haptics;
      feedback.enabledSound = settings.sound;
    };
    applyFeedback(store.getState());
    const unsubscribe = store.subscribe((s, prev) => { if (s.settings !== prev.settings) applyFeedback(s); });
    // Application en arrière-plan : pause des chronos (si réglé), puis écriture immédiate.
    const onHidden = () => {
      if (document.visibilityState !== 'hidden') return;
      const { settings, actions } = store.getState();
      if (settings.autoPause) actions.pauseAll();
      flush();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flush);
      unsubscribe();
      detach();
    };
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/**
 * Le store lui-même (lecture ponctuelle avec getState(), sans abonnement).
 * @returns {AppStore}
 */
export const useStoreApi = () => useContext(StoreContext);

/**
 * Abonnement à une partie de l'état : le composant n'est rendu à nouveau que si elle change.
 * Ex. : `const hunts = useAppState(s => s.hunts)` ou `const { ui, settings } = useAppState(s => ({ ui: s.ui, settings: s.settings }))`.
 * @template T
 * @param {(s: AppState) => T} selector
 * @returns {T}
 */
export const useAppState = selector => useStore(useStoreApi(), useShallow(selector));

/**
 * Actions du store (référence stable, sans abonnement).
 * @returns {Actions}
 */
export const useActions = () => useStoreApi().getState().actions;

/** Dernière capture de chaque espèce : { clé: capture }. */
export const useShinies = () => useAppState(selectShinies);
/** Exemplaires de chaque espèce : { clé: [captures] }. */
export const useCatchesByKey = () => useAppState(selectCatchesByKey);
