import { useCallback, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Package, ArrowRight } from 'lucide-react';
import { useActions, useAppState, useShinies, useStoreApi } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { MAIN_DEX } from '../../data/pokedex.js';
import { boxOrder, boxesOf, boxedKeys, boxSummary, keysToStore } from '../../domain/boxes.js';
import { fmtNumber } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Field, Segmented } from '../../ui/index.js';
import BoxGrid from './BoxGrid.jsx';

/**
 * Rangement du living dex dans les boîtes de Pokémon HOME : la place de chaque shiny, ce qui reste à ranger,
 * et les trous. Mode « Ranger » : un toucher marque le shiny rangé ; mode « Fiches » : ouvre sa fiche.
 */
export default function BoxesTool() {
  const { catches, boxFirst, boxForms } = useAppState(s => ({ catches: s.catches, boxFirst: s.settings.boxFirst || 1, boxForms: s.settings.boxForms }));
  const shinies = useShinies();
  const store = useStoreApi();
  const { setBoxed, setSettings, setUiValue } = useActions();
  const { openPokemon } = useNav();
  const [mode, setMode] = useState('store');

  const order = boxOrder(MAIN_DEX, boxForms);
  const boxes = useMemo(() => boxesOf(order, boxFirst), [order, boxFirst]);
  const boxed = useMemo(() => boxedKeys(catches), [catches]);
  const summaries = useMemo(() => boxes.map(b => boxSummary(b.slots, shinies, boxed)), [boxes, shinies, boxed]);
  const total = summaries.reduce((acc, s) => ({ stored: acc.stored + s.stored, toStore: acc.toStore + s.toStore }), { stored: 0, toStore: 0 });

  const [index, setIndexState] = useState(() => {
    const saved = store.getState().ui.boxIndex;
    return Number.isInteger(saved) && saved >= 0 ? saved : 0;
  });
  const current = Math.min(index, boxes.length - 1);
  const setIndex = useCallback(i => {
    const next = Math.max(0, Math.min(boxes.length - 1, i));
    setIndexState(next);
    setUiValue('boxIndex', next);
  }, [boxes.length, setUiValue]);
  const box = boxes[current];
  const summary = summaries[current];
  const toStore = keysToStore(box.slots, shinies, boxed);
  const nextToStore = summaries.findIndex((s, i) => i !== current && s.toStore > 0);

  const onTap = useCallback((p, status) => {
    if (mode === 'open' || status === 'missing' || status === 'locked') return openPokemon(p.key);
    setBoxed([p.key], status !== 'stored', status === 'stored' ? `${p.name} retiré des boîtes` : `${p.name} rangé`);
    feedback.tap();
  }, [mode, openPokemon, setBoxed]);
  const onSwipe = useCallback(dir => setIndex(current + dir), [setIndex, current]);

  const first = box.slots[0];
  const last = box.slots.at(-1);
  return (
    // Marge du bas : le bouton de l'assistant ne cache pas les réglages.
    <div className="space-y-4 pb-16">
      <section className="card p-4 space-y-2">
        <h3 className="label-caps flex items-center gap-2"><Package className="w-4 h-4" /> Living dex dans HOME</h3>
        <p className="text-sm text-slate-300">
          <span className="font-black text-emerald-300">{fmtNumber(total.stored)}</span> rangés ·{' '}
          <span className="font-black text-amber-300">{fmtNumber(total.toStore)}</span> à ranger · {boxes.length} boîtes de 30, dans l'ordre du Pokédex.
        </p>
        {nextToStore >= 0 && (
          <button onClick={() => setIndex(nextToStore)} className="btn-secondary w-full min-h-11 text-sm">
            Boîte {boxes[nextToStore].number} : {summaries[nextToStore].toStore} à ranger <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </section>

      <div className="flex items-center gap-2">
        <button onClick={() => setIndex(current - 1)} disabled={current === 0} className="icon-btn w-12 h-12 shrink-0 bg-slate-900 border border-slate-800 disabled:opacity-30" aria-label="Boîte précédente">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <select className="input flex-1 min-w-0 text-center font-bold" value={current} onChange={e => setIndex(Number(e.target.value))} aria-label="Boîte">
          {boxes.map((b, i) => (
            <option key={b.number} value={i}>Boîte {b.number}{summaries[i].toStore ? ` · ${summaries[i].toStore} à ranger` : ''}</option>
          ))}
        </select>
        <button onClick={() => setIndex(current + 1)} disabled={current === boxes.length - 1} className="icon-btn w-12 h-12 shrink-0 bg-slate-900 border border-slate-800 disabled:opacity-30" aria-label="Boîte suivante">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <section className="card p-3 space-y-3" aria-label={`Boîte ${box.number}`}>
        <div className="flex items-center justify-between gap-2 px-1">
          <h3 className="text-base font-black text-white">Boîte {box.number}</h3>
          <span className="text-xs text-slate-400 truncate">n° {first.id} {first.name} → n° {last.id} · {summary.stored + summary.toStore}/{box.slots.length}</span>
        </div>
        <Segmented size="sm" value={mode} onChange={setMode} options={[{ id: 'store', label: 'Ranger' }, { id: 'open', label: 'Fiches' }]} />
        <BoxGrid slots={box.slots} shinies={shinies} boxed={boxed} onTap={onTap} onSwipe={onSwipe} />
        <p className="text-[11px] text-slate-500 px-1">✓ rangé · <span className="text-amber-300">●</span> à ranger · grisé : manquant (🔒 Shiny Lock). Glisse pour changer de boîte.</p>
        {toStore.length > 0 && (
          <button className="btn-primary w-full" onClick={() => { setBoxed(toStore, true, `Boîte ${box.number} : ${toStore.length} shiny rangés`); feedback.success(); }}>
            Tout ranger dans la boîte {box.number} ({toStore.length})
          </button>
        )}
      </section>

      <section className="card p-4 space-y-4">
        <h3 className="label-caps">Réglages des boîtes</h3>
        <Field label="Première boîte du living dex dans HOME" hint="Si tes premières boîtes servent à autre chose.">
          <input type="number" inputMode="numeric" min="1" max="200" className="input font-mono" value={boxFirst}
            onChange={e => setSettings({ boxFirst: Math.min(200, Math.max(1, parseInt(e.target.value, 10) || 1)) })} />
        </Field>
        <Field group label="Formes régionales (Alola, Galar, Hisui, Paldea)">
          <Segmented value={boxForms === 'end' ? 'end' : 'after'} onChange={v => setSettings({ boxForms: v })}
            options={[{ id: 'after', label: 'Après l\'espèce' }, { id: 'end', label: 'À la fin' }]} />
        </Field>
      </section>
    </div>
  );
}
