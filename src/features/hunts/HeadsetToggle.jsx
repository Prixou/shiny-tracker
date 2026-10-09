import { Headphones } from 'lucide-react';
import { useAppState } from '../../state/StoreProvider.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { remoteSupported, startRemote, stopRemote } from '../../lib/mediaRemote.js';
import { useToast } from '../../ui/index.js';
import { useRemote } from './HeadsetRemote.jsx';

/** Compter avec les boutons des écouteurs Bluetooth ou depuis l'écran verrouillé, téléphone en poche. */
export default function HeadsetToggle({ hunt }) {
  const remote = useRemote();
  const otherName = useAppState(s => {
    if (!remote.active || remote.target === hunt.id) return null;
    const other = s.hunts.find(h => h.id === remote.target);
    return other ? getPokemon(other.targetId)?.name || null : null;
  });
  const toast = useToast();
  if (!remoteSupported()) return null;

  const start = async () => {
    if (!(await startRemote(hunt.id))) toast('Le navigateur refuse la lecture audio : les écouteurs ne peuvent pas compter.', { type: 'error', duration: 6000 });
  };

  if (remote.active && remote.target === hunt.id) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40" aria-live="polite">
        <Headphones className="w-5 h-5 shrink-0 text-emerald-300" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-emerald-200">Écouteurs actifs</div>
          <div className="text-xs text-slate-300">1 appui : +{hunt.step} · 3 appuis : −{hunt.step}, avec un bip. Marche aussi écran verrouillé.</div>
        </div>
        <button onClick={stopRemote} className="btn-secondary shrink-0 min-h-11 px-3 text-xs">Arrêter</button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button onClick={start} className="btn-secondary w-full min-h-12 text-sm">
        <Headphones className="w-4 h-4" />
        {otherName ? `Écouteurs : passer de ${otherName} à cette chasse` : remote.interrupted ? 'Écouteurs coupés : reprendre' : 'Compter avec les écouteurs'}
      </button>
      {!remote.active && (
        <p className="text-[11px] text-slate-500 px-1">
          {remote.interrupted
            ? 'Un appel ou une autre app audio a repris la main.'
            : 'Téléphone en poche : un appui sur tes écouteurs Bluetooth (ou ▶ sur l\'écran verrouillé) compte une rencontre.'}
        </p>
      )}
    </div>
  );
}
