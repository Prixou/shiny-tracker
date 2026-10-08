import { useEffect, useState } from 'react';
import { loadEncounters } from '../services/encounters.js';

/**
 * Données de lieux de capture (volumineuses, chargées une seule fois puis gardées en mémoire).
 * Renvoie null pendant le chargement, { error: true } en cas d'échec. `enabled` : ne charge que si vrai.
 */
export function useEncounters(enabled = true) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled || data) return;
    let alive = true;
    loadEncounters()
      .then(d => { if (alive) setData(d); })
      .catch(() => { if (alive) setData({ error: true }); });
    return () => { alive = false; };
  }, [enabled, data]);
  return data;
}
