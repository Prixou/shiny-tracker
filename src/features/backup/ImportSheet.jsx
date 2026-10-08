import { useMemo } from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { useStore } from '../../state/store.jsx';
import { parseImport } from '../../domain/backup.js';
import { Sheet } from '../../ui/ui.jsx';

// `code` : lien/QR (#import=…), JSON collé ou objet déjà lu depuis un fichier.
export default function ImportSheet({ code, onClose }) {
  const { importData, catches, hunts } = useStore();
  const parsed = useMemo(() => {
    if (!code) return null;
    try {
      return { data: parseImport(code) };
    } catch (e) {
      return { error: e.message };
    }
  }, [code]);

  const apply = mode => {
    importData(parsed.data, mode);
    onClose();
  };

  const d = parsed?.data;
  return (
    <Sheet open={!!code} onClose={onClose} title="Importer une sauvegarde" icon={<Download className="w-5 h-5" />}
      footer={d ? (
        <div className="space-y-2">
          <button className="btn-primary w-full" onClick={() => apply('merge')}>Fusionner avec mes données</button>
          <button className="btn-secondary w-full text-rose-300" onClick={() => apply('replace')}>Remplacer toutes mes données</button>
        </div>
      ) : <button className="btn-secondary w-full" onClick={onClose}>Fermer</button>}>
      {parsed?.error ? (
        <div className="flex gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Impossible de lire cette sauvegarde ({parsed.error}). Vérifie que le code ou le fichier est complet.</span>
        </div>
      ) : d && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Shiny', value: d.catches.length },
              { label: 'Chasses', value: d.hunts.length },
              { label: 'Listes', value: d.lists.length + (Object.keys(d.wishlist).length ? 1 : 0) }
            ].map(s => (
              <div key={s.label} className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-2xl font-black font-mono text-amber-400">{s.value}</div>
                <div className="text-xs font-bold text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Actuellement sur cet appareil : <strong>{catches.length}</strong> shiny et <strong>{hunts.length}</strong> chasses.
            La <strong>fusion</strong> garde la version la plus récente de chaque entrée ; le <strong>remplacement</strong> efface les données actuelles.
          </p>
        </div>
      )}
    </Sheet>
  );
}
