import { useEffect, useState } from 'react';
import { PlusCircle, Sparkles, RefreshCw } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { getPokemon } from '../data/pokedex.js';
import { GAMES, SHINY_METHODS, methodOdds, GAME_BY_ID } from '../data/constants.js';
import { encountersFor, fmtNumber, fmtOdds } from '../lib/utils.js';
import { Sheet, Field, Toggle, Sprite, TypeBadge } from './ui.jsx';
import PokemonPicker from './PokemonPicker.jsx';

export default function NewHuntSheet({ open, initialTarget, onClose }) {
  const { settings, createHunt } = useStore();
  const { goTo } = useNav();
  const [target, setTarget] = useState(null);
  const [picking, setPicking] = useState(true);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!open) return;
    const t = initialTarget ? getPokemon(initialTarget) : null;
    setTarget(t);
    setPicking(!t);
    const method = settings.defaultMethod || 'wild';
    setForm({ game: settings.defaultGame || 'sv', method, charm: settings.charm, odds: methodOdds(method, settings.charm), step: 1, count: 0, customOdds: false });
  }, [open, initialTarget, settings.defaultGame, settings.defaultMethod, settings.charm]);

  if (!form) return null;
  const update = patch => setForm(f => {
    const next = { ...f, ...patch };
    if (!next.customOdds && ('method' in patch || 'charm' in patch)) next.odds = methodOdds(next.method, next.charm);
    return next;
  });

  const start = () => {
    createHunt({ targetId: target.key, game: form.game, method: form.method, charm: form.charm, odds: form.odds, step: form.step, count: form.count });
    onClose();
    goTo('hunts');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nouvelle chasse"
      icon={<PlusCircle className="w-5 h-5" />}
      full={picking}
      footer={!picking && target ? (
        <button className="btn-primary w-full" onClick={start}>
          <Sparkles className="w-4 h-4" /> Lancer la chasse
        </button>
      ) : null}
    >
      {picking ? (
        <PokemonPicker onPick={p => { setTarget(p); setPicking(false); }} />
      ) : target && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-3xl bg-gradient-to-r from-amber-500/10 to-slate-950 border border-amber-500/30">
            <Sprite pokemon={target} className="w-20 h-20" />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-black text-white truncate">{target.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">{target.types.map(t => <TypeBadge key={t} type={t} small />)}</div>
            </div>
            <button onClick={() => setPicking(true)} className="icon-btn bg-slate-900 border border-slate-800" aria-label="Changer de Pokémon">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <Field label="Jeu" hint={GAME_BY_ID[form.game]?.bestMethod ? `💡 Méthode phare : ${GAME_BY_ID[form.game].bestMethod}` : null}>
            <select className="input" value={form.game} onChange={e => update({ game: e.target.value })}>
              {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
          </Field>

          <Field label="Méthode">
            <select className="input" value={form.method} onChange={e => update({ method: e.target.value })}>
              {SHINY_METHODS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
            </select>
          </Field>

          <div className="card px-4 divide-y divide-slate-800">
            <Toggle checked={form.charm} onChange={charm => update({ charm })} label="Charme Chroma" desc="Augmente le nombre de tirages shiny selon la méthode" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Taux 1/x">
              <input type="number" inputMode="numeric" min="1" className="input font-mono px-3" value={form.odds}
                onChange={e => update({ odds: Math.max(1, parseInt(e.target.value, 10) || 1), customOdds: true })} />
            </Field>
            <Field label="Pas (+x)">
              <input type="number" inputMode="numeric" min="1" max="100" className="input font-mono px-3" value={form.step}
                onChange={e => update({ step: Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)) })} />
            </Field>
            <Field label="Départ">
              <input type="number" inputMode="numeric" min="0" className="input font-mono px-3" value={form.count}
                onChange={e => update({ count: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
            </Field>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            À {fmtOdds(form.odds)}, il faut en moyenne <strong className="text-slate-200">{fmtNumber(form.odds)}</strong> rencontres ;
            50 % de chances après <strong className="text-slate-200">{fmtNumber(encountersFor(0.5, form.odds))}</strong> et
            90 % après <strong className="text-slate-200">{fmtNumber(encountersFor(0.9, form.odds))}</strong>.
            Le « pas » sert aux hordes ou aux œufs par 5 par exemple.
          </p>
        </div>
      )}
    </Sheet>
  );
}
