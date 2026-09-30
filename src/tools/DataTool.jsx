import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Upload, Share2, Copy, QrCode, ScanLine, ClipboardPaste, CloudOff, Smartphone, HardDrive, Link2 } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { POKEDEX, spriteUrl } from '../data/pokedex.js';
import { POKE_BALLS, ballSprite } from '../data/constants.js';
import { buildExport, backupFilename, downloadFile, shareFile, copyText, shareLink } from '../lib/sync.js';
import { useInstallPrompt } from '../lib/hooks.js';
import { Sheet, useToast } from '../components/ui.jsx';
import ImportSheet from '../components/ImportSheet.jsx';
import QrScanner from '../components/QrScanner.jsx';

export default function DataTool() {
  const store = useStore();
  const toast = useToast();
  const [importCode, setImportCode] = useState(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pasted, setPasted] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const fileRef = useRef(null);
  const json = () => JSON.stringify(buildExport(store), null, 1);
  const canShareFiles = typeof navigator.canShare === 'function';

  const onFile = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportCode(await file.text());
  };

  const onShare = async () => {
    try {
      if (!(await shareFile(backupFilename(), json()))) {
        downloadFile(backupFilename(), json());
      }
    } catch (e) {
      if (e?.name !== 'AbortError') toast('Partage impossible', { type: 'error' });
    }
  };

  const counts = { shinies: Object.keys(store.shinies).length, hunts: store.hunts.length };

  return (
    <div className="space-y-4">
      <section className="card p-4 space-y-3">
        <h3 className="label-caps flex items-center gap-2"><Download className="w-4 h-4" /> Sauvegarder</h3>
        <p className="text-sm text-slate-400">{counts.shinies} shiny et {counts.hunts} chasses stockés sur cet appareil. Pense à faire une sauvegarde de temps en temps.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => { downloadFile(backupFilename(), json()); toast('Fichier de sauvegarde téléchargé'); }}>
            <Download className="w-4 h-4" /> Fichier
          </button>
          {canShareFiles ? (
            <button className="btn-secondary" onClick={onShare}><Share2 className="w-4 h-4" /> Partager</button>
          ) : (
            <button className="btn-secondary" onClick={async () => toast((await copyText(json())) ? 'JSON copié' : 'Copie impossible', { type: 'info' })}><Copy className="w-4 h-4" /> Copier</button>
          )}
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <h3 className="label-caps flex items-center gap-2"><Upload className="w-4 h-4" /> Restaurer / importer</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Fichier</button>
          <button className="btn-secondary" onClick={() => setShowPaste(true)}><ClipboardPaste className="w-4 h-4" /> Coller</button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" className="hidden" onChange={onFile} />
        <p className="text-xs text-slate-500">Compatible avec les sauvegardes de l'ancienne version (JSON « shinyState »).</p>
      </section>

      <section className="card p-4 space-y-3">
        <h3 className="label-caps flex items-center gap-2"><Smartphone className="w-4 h-4" /> Transfert PC ⇄ mobile</h3>
        <p className="text-sm text-slate-400">Affiche un QR code sur un appareil, scanne-le avec l'autre : l'app s'ouvre et propose d'importer tes données.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={() => setShowQr(true)}><QrCode className="w-4 h-4" /> Afficher</button>
          <button className="btn-secondary" onClick={() => setShowScan(true)}><ScanLine className="w-4 h-4" /> Scanner</button>
        </div>
      </section>

      <OfflineSection />

      <QrSheet open={showQr} onClose={() => setShowQr(false)} />
      <QrScanner open={showScan} onClose={() => setShowScan(false)} onResult={code => { setShowScan(false); setImportCode(code); }} />

      <Sheet open={showPaste} onClose={() => setShowPaste(false)} title="Coller une sauvegarde" icon={<ClipboardPaste className="w-5 h-5" />}
        footer={<button className="btn-primary w-full" disabled={!pasted.trim()} onClick={() => { setShowPaste(false); setImportCode(pasted); setPasted(''); }}>Analyser</button>}>
        <div className="space-y-3">
          <textarea className="input py-3 min-h-40 font-mono text-xs" value={pasted} onChange={e => setPasted(e.target.value)} placeholder="Colle ici le JSON ou le lien d'import…" />
          {navigator.clipboard?.readText && (
            <button className="btn-ghost w-full" onClick={async () => { try { setPasted(await navigator.clipboard.readText()); } catch { toast('Accès au presse-papiers refusé', { type: 'error' }); } }}>
              <ClipboardPaste className="w-4 h-4" /> Coller depuis le presse-papiers
            </button>
          )}
        </div>
      </Sheet>

      <ImportSheet code={importCode} onClose={() => setImportCode(null)} />
    </div>
  );
}

function QrSheet({ open, onClose }) {
  const { shinies, hunts, wishlist } = useStore();
  const toast = useToast();
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!open) return;
    const link = shareLink({ shinies, hunts, wishlist });
    QRCode.toDataURL(link, { errorCorrectionLevel: 'L', margin: 2, width: 720, color: { dark: '#020617', light: '#ffffff' } })
      .then(url => setState({ url, link }))
      .catch(() => setState({ error: true, link }));
  }, [open, shinies, hunts, wishlist]);
  return (
    <Sheet open={open} onClose={onClose} title="QR code de transfert" subtitle="Les notes ne sont pas incluses (taille limitée)" icon={<QrCode className="w-5 h-5" />}>
      {!state ? null : state.error ? (
        <div className="space-y-3 text-sm text-slate-300">
          <p className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            Ta collection est trop grande pour tenir dans un seul QR code. Utilise plutôt le lien ci-dessous (à t'envoyer par message) ou un fichier de sauvegarde.
          </p>
          <button className="btn-secondary w-full" onClick={async () => toast((await copyText(state.link)) ? 'Lien copié' : 'Copie impossible')}><Link2 className="w-4 h-4" /> Copier le lien d'import</button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <img src={state.url} alt="QR code de transfert" className="w-full max-w-xs mx-auto rounded-2xl bg-white p-2" />
          <p className="text-xs text-slate-400">Scanne-le avec l'appareil photo de ton téléphone ou avec le bouton « Scanner » de l'app.</p>
          <button className="btn-secondary w-full" onClick={async () => toast((await copyText(state.link)) ? 'Lien copié' : 'Copie impossible')}><Link2 className="w-4 h-4" /> Copier le lien</button>
        </div>
      )}
    </Sheet>
  );
}

function OfflineSection() {
  const toast = useToast();
  const { canInstall, installed, prompt } = useInstallPrompt();
  const [progress, setProgress] = useState(null);
  const [storage, setStorage] = useState(null);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    navigator.storage?.estimate?.().then(e => setStorage(e)).catch(() => {});
  }, [progress]);

  const cacheSprites = async () => {
    const urls = [...POKEDEX.map(p => spriteUrl(p)), ...POKE_BALLS.map(b => ballSprite(b.id))];
    let done = 0;
    setProgress(0);
    const queue = [...urls];
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const url = queue.shift();
        try { await fetch(url, { mode: 'cors' }); } catch { /* ignoré */ }
        done++;
        if (done % 20 === 0 || done === urls.length) setProgress(done / urls.length);
      }
    }));
    setProgress(null);
    toast('Sprites disponibles hors ligne');
  };

  return (
    <section className="card p-4 space-y-3">
      <h3 className="label-caps flex items-center gap-2"><CloudOff className="w-4 h-4" /> Application & hors ligne</h3>
      {!installed && (canInstall ? (
        <button className="btn-primary w-full" onClick={prompt}><Smartphone className="w-4 h-4" /> Installer l'application</button>
      ) : (
        <p className="text-sm text-slate-400">
          {isIos ? 'Pour installer l\'app : bouton Partager de Safari → « Sur l\'écran d\'accueil ».' : 'Pour installer l\'app : menu du navigateur → « Installer l\'application » / « Ajouter à l\'écran d\'accueil ».'}
        </p>
      ))}
      {installed && <p className="text-sm text-emerald-300">✓ Application installée</p>}
      <button className="btn-secondary w-full" onClick={cacheSprites} disabled={progress != null}>
        <Download className="w-4 h-4" /> {progress != null ? `Téléchargement… ${Math.round(progress * 100)} %` : 'Télécharger tous les sprites (hors ligne)'}
      </button>
      {progress != null && (
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{ width: `${progress * 100}%` }} /></div>
      )}
      {storage?.usage != null && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Espace utilisé : {(storage.usage / 1048576).toFixed(1).replace('.', ',')} Mo</p>
      )}
    </section>
  );
}
