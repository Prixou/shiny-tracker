import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, LogOut, Mail, KeyRound, AlertTriangle, Settings2, Check } from 'lucide-react';
import { useCloud } from '../../state/cloud.jsx';
import { Sheet, Field, useToast } from '../../ui/ui.jsx';

const STATUS = {
  idle: { label: 'Synchronisé', cls: 'text-emerald-300' },
  syncing: { label: 'Synchronisation…', cls: 'text-amber-300' },
  offline: { label: 'Hors ligne : envoi au retour du réseau', cls: 'text-slate-400' },
  error: { label: 'Erreur de synchronisation', cls: 'text-rose-300' }
};

export default function CloudSection() {
  const cloud = useCloud();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [busy, setBusy] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const wrap = fn => async () => {
    setBusy(true);
    try { await fn(); } catch (e) { toast(e.message || 'Erreur', { type: 'error' }); } finally { setBusy(false); }
  };

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="label-caps flex items-center gap-2"><Cloud className="w-4 h-4" /> Synchronisation cloud</h3>
        {cloud.config && cloud.config.source !== 'build' && (
          <button onClick={() => setShowConfig(true)} className="icon-btn w-9 h-9 text-slate-400" aria-label="Configurer le serveur"><Settings2 className="w-4 h-4" /></button>
        )}
      </div>

      {cloud.status === 'off' && (
        <>
          <p className="text-sm text-slate-400">Retrouve tes données en direct sur ton téléphone et ton PC avec un compte. Il faut d'abord relier l'app à un projet Supabase (gratuit), voir le README.</p>
          <button className="btn-secondary w-full" onClick={() => setShowConfig(true)}><Settings2 className="w-4 h-4" /> Configurer le serveur</button>
        </>
      )}

      {cloud.status === 'signedOut' && (
        step === 'email' ? (
          <form className="space-y-2" onSubmit={e => { e.preventDefault(); wrap(async () => { await cloud.sendCode(email.trim()); setStep('code'); toast('Code envoyé par e-mail'); })(); }}>
            <p className="text-sm text-slate-400">Connecte-toi avec ton e-mail : tu recevras un code à 6 chiffres (ou un lien).</p>
            <input type="email" required autoComplete="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.fr" />
            <button className="btn-primary w-full" disabled={busy || !email.includes('@')}><Mail className="w-4 h-4" /> Recevoir le code</button>
          </form>
        ) : (
          <form className="space-y-2" onSubmit={e => { e.preventDefault(); wrap(async () => { await cloud.verifyCode(email.trim(), code.trim()); setStep('email'); setCode(''); })(); }}>
            <p className="text-sm text-slate-400">Saisis le code reçu à <strong className="text-slate-200">{email}</strong>.</p>
            <input inputMode="numeric" autoComplete="one-time-code" className="input font-mono tracking-[0.4em] text-center text-xl" maxLength={10} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={() => setStep('email')}>Changer d'e-mail</button>
              <button className="btn-primary" disabled={busy || code.length < 6}><KeyRound className="w-4 h-4" /> Valider</button>
            </div>
          </form>
        )
      )}

      {cloud.user && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm">
            <div className="font-bold text-slate-100 truncate">{cloud.user.email}</div>
            <div className={`text-xs ${STATUS[cloud.status]?.cls || 'text-slate-400'}`}>
              {STATUS[cloud.status]?.label || cloud.status}
              {cloud.lastSync && cloud.status === 'idle' ? ` · ${new Date(cloud.lastSync).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}
            </div>
            {cloud.error && <div className="text-xs text-rose-300 mt-1">{cloud.error}</div>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={cloud.syncNow} disabled={cloud.status === 'syncing'}><RefreshCw className={`w-4 h-4 ${cloud.status === 'syncing' ? 'animate-spin' : ''}`} /> Synchroniser</button>
            <button className="btn-secondary" onClick={wrap(cloud.signOut)}><LogOut className="w-4 h-4" /> Déconnexion</button>
          </div>
          <p className="text-xs text-slate-500">Les modifications sont envoyées automatiquement. Si deux appareils modifient en même temps, les données sont fusionnées (un élément supprimé sur l'un peut alors réapparaître).</p>
        </div>
      )}

      <ConfigSheet open={showConfig} onClose={() => setShowConfig(false)} />
      <ConflictSheet />
    </section>
  );
}

function ConfigSheet({ open, onClose }) {
  const cloud = useCloud();
  const [url, setUrl] = useState(cloud.config?.url || '');
  const [key, setKey] = useState(cloud.config?.key || '');
  return (
    <Sheet open={open} onClose={onClose} title="Serveur de synchronisation" icon={<Settings2 className="w-5 h-5" />}
      footer={
        <div className="flex gap-2">
          {cloud.config && <button className="btn-secondary" onClick={() => { cloud.setConfig(null); onClose(); }}><CloudOff className="w-4 h-4" /> Retirer</button>}
          <button className="btn-primary flex-1" disabled={!/^https:\/\/.+/.test(url) || key.length < 20} onClick={() => { cloud.setConfig({ url: url.trim(), key: key.trim() }); onClose(); }}><Check className="w-4 h-4" /> Enregistrer</button>
        </div>
      }>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">Crée un projet sur supabase.com, exécute le script <code className="text-amber-300">supabase/schema.sql</code> puis colle ici l'URL du projet et la clé publique « anon ». Tu peux aussi les définir au build (variables <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>).</p>
        <Field label="URL du projet"><input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" autoCapitalize="off" autoCorrect="off" /></Field>
        <Field label="Clé publique (anon)"><input className="input font-mono text-sm" value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGciOi…" autoCapitalize="off" autoCorrect="off" /></Field>
      </div>
    </Sheet>
  );
}

function ConflictSheet() {
  const cloud = useCloud();
  const c = cloud.conflict;
  return (
    <Sheet open={!!c} onClose={() => {}} title="Données déjà présentes dans le cloud" icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}>
      {c && (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Ton compte contient déjà <strong>{c.remote.catches.length}</strong> shiny et <strong>{c.remote.hunts.length}</strong> chasses. Que faire des données de cet appareil ?
          </p>
          <div className="space-y-2">
            <button className="btn-primary w-full" onClick={() => cloud.resolveConflict('merge')}>Fusionner (recommandé)</button>
            <button className="btn-secondary w-full" onClick={() => cloud.resolveConflict('cloud')}>Garder seulement le cloud</button>
            <button className="btn-secondary w-full text-rose-300" onClick={() => cloud.resolveConflict('local')}>Remplacer le cloud par cet appareil</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
