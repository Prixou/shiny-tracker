import { useEffect, useSyncExternalStore } from 'react';
import { useActions, useAppState, useStoreApi } from '../../state/StoreProvider.jsx';
import { getRemoteState, setRemoteHandlers, setRemoteInfo, stopRemote, subscribeRemote } from '../../lib/mediaRemote.js';
import { remoteInfo } from '../../domain/hunt.js';
import { feedback } from '../../lib/feedback.js';

/** État de la télécommande (écouteurs, écran verrouillé), mis à jour en direct. */
export const useRemote = () => useSyncExternalStore(subscribeRemote, getRemoteState);

/**
 * Branche la télécommande sur la chasse choisie, quel que soit l'onglet affiché : +1 / −1 avec bip dans
 * les écouteurs, compteur et chance sur l'écran verrouillé. Monté une fois dans la coquille de l'app.
 */
export default function HeadsetRemote() {
  const remote = useRemote();
  const hunt = useAppState(s => (remote.active ? s.hunts.find(h => h.id === remote.target) || null : null));
  const store = useStoreApi();
  const { increment } = useActions();

  useEffect(() => {
    if (!remote.active) return;
    // Lecture au moment de l'appui : jamais un compteur périmé.
    const current = () => store.getState().hunts.find(h => h.id === remote.target);
    setRemoteHandlers({
      plus: () => {
        const h = current();
        if (!h) return;
        increment(h.id, h.step);
        feedback.remote(true);
      },
      minus: () => {
        const h = current();
        if (!h || h.count <= 0) return;
        increment(h.id, -h.step);
        feedback.remote(false);
      }
    });
  }, [remote.active, remote.target, store, increment]);

  // Chasse terminée ou supprimée : la télécommande s'arrête.
  useEffect(() => {
    if (remote.active && (!hunt || hunt.status !== 'active')) stopRemote();
  }, [remote.active, hunt]);

  useEffect(() => {
    if (remote.active && hunt) setRemoteInfo(remoteInfo(hunt));
  }, [remote.active, hunt]);

  return null;
}
