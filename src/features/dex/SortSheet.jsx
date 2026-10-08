import { ArrowUpDown, Check, Grid3x3 } from 'lucide-react';
import { useActions } from '../../state/StoreProvider.jsx';
import { SORTS } from '../../domain/dexFilter.js';
import { Sheet, Segmented } from '../../ui/index.js';

/** Panneau « Tri et affichage » : ordre de la grille et taille des cases. */
export default function SortSheet({ open, onClose, sort, onSort, density }) {
  const { setSettings } = useActions();
  return (
    <Sheet open={open} onClose={onClose} title="Tri et affichage" icon={<ArrowUpDown className="w-5 h-5" />}>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="label-caps">Trier par</div>
          {SORTS.map(s => (
            <button key={s.id} onClick={() => { onSort(s.id); onClose(); }}
              className={`w-full flex items-center justify-between min-h-12 px-4 rounded-2xl border text-sm font-bold ${sort === s.id ? 'bg-amber-500/10 border-amber-500/60 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-200'}`}>
              {s.label} {sort === s.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <div className="label-caps flex items-center gap-2"><Grid3x3 className="w-3.5 h-3.5" /> Taille de la grille</div>
          <Segmented value={density} onChange={d => setSettings({ density: d })}
            options={[{ id: 3, label: 'Grande' }, { id: 4, label: 'Moyenne' }, { id: 5, label: 'Compacte' }]} />
        </div>
      </div>
    </Sheet>
  );
}
