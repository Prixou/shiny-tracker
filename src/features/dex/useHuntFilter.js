import { useMemo } from 'react';
import { useEncounters } from '../../state/encounters.js';
import { huntMethodIndex } from '../../domain/huntIndex.js';

const NONE = new Set();

/**
 * Pokémon de la méthode choisie dans le filtre « Chassable avec » (les données de lieux se chargent à la demande).
 * @param {string | undefined} hunt « jeu|méthode » ou 'all'.
 * @returns {{ keys: Set<string> | null, status: 'off' | 'loading' | 'error' | 'ready' }}
 */
export function useHuntFilter(hunt) {
  const active = !!hunt && hunt !== 'all';
  const data = useEncounters(active);
  return useMemo(() => {
    if (!active) return { keys: null, status: 'off' };
    if (!data) return { keys: NONE, status: 'loading' };
    if (data.error) return { keys: NONE, status: 'error' };
    return { keys: huntMethodIndex(data).byId.get(hunt)?.keys || NONE, status: 'ready' };
  }, [active, data, hunt]);
}
