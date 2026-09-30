import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './store.jsx';
import { getCloudConfig, saveCloudConfig, getClient, resetClient, loadMeta, saveMeta, syncCycle, TABLE } from '../lib/cloud.js';

const CloudContext = createContext({ config: null, status: 'off' });
export const useCloud = () => useContext(CloudContext);

const AUTO_DELAY = 2500;

export function CloudProvider({ children }) {
  const store = useStore();
  const { catches, hunts, wishlist, lists, dataStamp, replaceData } = store;
  const [config, setConfigState] = useState(() => getCloudConfig());
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(config ? 'idle' : 'off');
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(() => loadMeta().lastSync || null);
  const [conflict, setConflict] = useState(null);

  const meta = useRef(loadMeta());
  const local = useRef();
  local.current = { catches, hunts, wishlist, lists };
  const stampRef = useRef(dataStamp);
  stampRef.current = dataStamp;
  const suppress = useRef(false);
  const busy = useRef(false);
  const again = useRef(false);

  const writeMeta = useCallback(patch => {
    meta.current = { ...meta.current, ...patch };
    saveMeta(meta.current);
  }, []);

  // Client Supabase chargé uniquement si la synchronisation est configurée.
  useEffect(() => {
    if (!config) { setClient(null); setUser(null); setStatus('off'); return; }
    let alive = true;
    let sub = null;
    getClient(config).then(async c => {
      if (!alive) return;
      setClient(c);
      const { data } = await c.auth.getSession();
      if (alive) setUser(data.session?.user || null);
      sub = c.auth.onAuthStateChange((_event, session) => setUser(session?.user || null)).data.subscription;
    }).catch(e => { setError(e.message); setStatus('error'); });
    return () => { alive = false; sub?.unsubscribe(); };
  }, [config]);

  const run = useCallback(async (force = null) => {
    if (!client || !user) return;
    if (!navigator.onLine) { setStatus('offline'); return; }
    if (busy.current) { again.current = true; return; }
    busy.current = true;
    setStatus('syncing');
    setError(null);
    try {
      const startStamp = stampRef.current;
      const dirty = startStamp > (meta.current.pushedStamp || 0);
      const res = await syncCycle({ client, userId: user.id, local: local.current, dirty, meta: meta.current, force });
      if (res.action === 'conflict') {
        setConflict({ remote: res.remote });
        setStatus('idle');
        return;
      }
      if (res.doc && (res.action === 'apply' || res.action === 'merge')) {
        suppress.current = true;
        replaceData(res.doc);
      }
      const now = Date.now();
      writeMeta({ userId: user.id, remoteStamp: res.stamp, pushedStamp: res.doc ? meta.current.pushedStamp : startStamp, lastSync: now });
      setLastSync(now);
      setConflict(null);
      setStatus('idle');
    } catch (e) {
      setError(e.message || String(e));
      setStatus('error');
    } finally {
      busy.current = false;
      if (again.current) { again.current = false; setTimeout(() => run(), 300); }
    }
  }, [client, user, replaceData, writeMeta]);

  // Après application des données distantes, la modification locale qui en résulte n'est pas renvoyée.
  useEffect(() => {
    if (suppress.current) {
      suppress.current = false;
      writeMeta({ pushedStamp: dataStamp });
      return;
    }
    if (!user || !client || dataStamp <= (meta.current.pushedStamp || 0)) return;
    const t = setTimeout(() => run(), AUTO_DELAY);
    return () => clearTimeout(t);
  }, [dataStamp, user, client, run, writeMeta]);

  // Synchronisation à la connexion, au retour dans l'app et au retour du réseau.
  useEffect(() => {
    if (!user || !client) return;
    run();
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    const onOnline = () => run();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [user, client, run]);

  // Temps réel : les modifications faites sur un autre appareil arrivent sans recharger.
  useEffect(() => {
    if (!user || !client) return;
    const channel = client.channel(`shiny-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${user.id}` }, payload => {
        if (Number(payload.new?.client_stamp) !== Number(meta.current.remoteStamp)) run();
      })
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, [user, client, run]);

  const value = useMemo(() => ({
    config,
    status: !config ? 'off' : user ? status : 'signedOut',
    user,
    error,
    lastSync,
    conflict,
    setConfig(cfg) {
      saveCloudConfig(cfg);
      resetClient();
      setConfigState(cfg ? getCloudConfig() : null);
    },
    async sendCode(email) {
      const { error: e } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
      if (e) throw e;
    },
    async verifyCode(email, token) {
      const { error: e } = await client.auth.verifyOtp({ email, token, type: 'email' });
      if (e) throw e;
    },
    async signOut() {
      await client?.auth.signOut();
      writeMeta({ userId: null, remoteStamp: 0, pushedStamp: 0 });
      setUser(null);
    },
    syncNow: () => run(),
    resolveConflict: choice => run(choice)
  }), [config, user, status, error, lastSync, conflict, client, run, writeMeta]);

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}
