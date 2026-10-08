import { useEffect, useRef, useState, useCallback } from 'react';

// Re-rend le composant chaque seconde tant que `active` est vrai (affichage des chronomètres).
export function useNow(active, interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [active, interval]);
  return now;
}

// Garde l'écran allumé (Screen Wake Lock API) tant que `enabled` est vrai.
export function useWakeLock(enabled) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || cancelled) return;
      try {
        lock = await navigator.wakeLock.request('screen');
        setActive(true);
        lock.addEventListener('release', () => setActive(false));
      } catch {
        setActive(false);
      }
    };
    acquire();
    const onVis = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => {});
      setActive(false);
    };
  }, [enabled]);
  return active;
}

// Ferme une fenêtre (sheet) avec le bouton « retour » d'Android / le geste retour iOS.
// Chaque fenêtre ouverte ajoute une entrée d'historique ; la refermer par l'interface la retire.
// Les `history.back()` étant asynchrones, les ouvertures qui suivent attendent leur traitement.
let pendingBacks = 0;
let waiting = [];
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (pendingBacks > 0 && --pendingBacks === 0) {
      const q = waiting;
      waiting = [];
      q.forEach(fn => fn());
    }
  });
}

export function useBackClose(open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = Math.random().toString(36).slice(2);
    let pushed = false;
    let poppedByBack = false;
    const onPop = () => {
      if (pendingBacks > 0 || window.history.state?.sheet === id) return;
      poppedByBack = true;
      window.removeEventListener('popstate', onPop);
      onCloseRef.current?.();
    };
    const push = () => {
      pushed = true;
      window.history.pushState({ sheet: id }, '');
      window.addEventListener('popstate', onPop);
    };
    if (pendingBacks > 0) waiting.push(push); else push();
    return () => {
      waiting = waiting.filter(fn => fn !== push);
      if (!pushed) return;
      window.removeEventListener('popstate', onPop);
      if (!poppedByBack && window.history.state?.sheet === id) {
        pendingBacks++;
        window.history.back();
      }
    };
  }, [open]);
}

export function useInstallPrompt() {
  const [event, setEvent] = useState(null);
  const [installed, setInstalled] = useState(() =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  useEffect(() => {
    const onPrompt = e => { e.preventDefault(); setEvent(e); };
    const onInstalled = () => { setInstalled(true); setEvent(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const prompt = useCallback(async () => {
    if (!event) return false;
    event.prompt();
    const choice = await event.userChoice.catch(() => null);
    setEvent(null);
    return choice?.outcome === 'accepted';
  }, [event]);
  return { canInstall: !!event, installed, prompt };
}

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export function useDebouncedValue(value, delay = 150) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * Affichage progressif d'une longue liste (rendu par paquets de `page` éléments au défilement).
 * Renvoie [limite, ref à poser sur un élément sentinelle en bas de liste]. La limite repart à `page` quand `resetKey` change.
 */
export function useProgressiveList({ page = 72, resetKey } = {}) {
  const [limit, setLimit] = useState(page);
  const sentinel = useRef(null);
  useEffect(() => { setLimit(page); }, [resetKey, page]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setLimit(l => l + page);
    }, { rootMargin: '1200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [limit, page]);
  return [limit, sentinel];
}
