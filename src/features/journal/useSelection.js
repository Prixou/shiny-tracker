import { useCallback, useState } from 'react';
import { useBackClose } from '../../lib/hooks.js';

/**
 * Mode sélection d'une liste : identifiants cochés, et sortie du mode par le bouton retour d'Android.
 * @returns {{ active: boolean, ids: Set<string>, start: () => void, stop: () => void, toggle: (id: string) => void,
 *   setMany: (ids: string[], on: boolean) => void, clear: () => void }}
 */
export function useSelection() {
  const [active, setActive] = useState(false);
  const [ids, setIds] = useState(() => new Set());
  const stop = useCallback(() => {
    setActive(false);
    setIds(new Set());
  }, []);
  useBackClose(active, stop);
  const start = useCallback(() => setActive(true), []);
  const toggle = useCallback(id => setIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);
  const setMany = useCallback((list, on) => setIds(prev => {
    const next = new Set(prev);
    for (const id of list) {
      if (on) next.add(id); else next.delete(id);
    }
    return next;
  }), []);
  const clear = useCallback(() => setIds(new Set()), []);
  return { active, ids, start, stop, toggle, setMany, clear };
}
