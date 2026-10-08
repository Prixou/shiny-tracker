import { useCallback, useEffect } from 'react';
import { useActions, useStoreApi } from '../state/StoreProvider.jsx';
import { useToast } from '../ui/index.js';
import { feedback } from '../lib/feedback.js';

/**
 * Annulation : chaque action annulable affiche un toast « Annuler » ; Ctrl/Cmd+Z annule aussi.
 * Renvoie la fonction d'annulation (bouton ↶ de l'en-tête).
 */
export function useUndo() {
  const store = useStoreApi();
  const { undo } = useActions();
  const toast = useToast();

  const doUndo = useCallback(() => {
    const entry = undo();
    if (!entry) return;
    feedback.undo();
    toast(`Annulé : ${entry.label}`, { type: 'info' });
  }, [undo, toast]);

  // Nouvelle entrée d'annulation → toast, affiché après les éventuels messages de l'action elle-même.
  useEffect(() => store.subscribe((s, prev) => {
    const top = s.undoStack.at(-1);
    if (!top || prev.undoStack.includes(top)) return;
    queueMicrotask(() => toast(top.label, { action: { label: 'Annuler', onClick: doUndo }, duration: 4500 }));
  }), [store, toast, doUndo]);

  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        doUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doUndo]);

  return doUndo;
}
