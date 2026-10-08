import { useEffect, useState } from 'react';
import { PlusCircle, Sparkles, RefreshCw, ShieldAlert } from 'lucide-react';
import { useStore, defaultMethodFor } from '../../state/store.jsx';
import { useNav } from '../../app/nav.jsx';
import { getPokemon, isAvailableIn } from '../../data/pokedex.js';
import { isLockedIn, GAME_BY_ID } from '../../data/constants.js';
import { encountersFor, METHOD_BY_ID } from '../../data/methods.js';
import { fmtNumber } from '../../lib/utils.js';
import { hasCharm } from '../../domain/myGames.js';
import { Sheet, Field, Sprite, TypeBadge } from '../../ui/ui.jsx';
import PokemonPicker from '../pokemon/PokemonPicker.jsx';
import OddsConfig from './OddsConfig.jsx';

export default function NewHuntSheet({ open, initialTarget, preset, onClose }) {
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
    const game = settings.defaultGame || 'sv';
    const method = defaultMethodFor(game);
    const base = { game, method, opts: {}, charm: hasCharm(settings, game), customOdds: null, count: 0 };
    // Préréglage venant des « Meilleures options shiny » de la fiche.
    const cfg = preset ? { ...base, ...preset, opts: { ...(preset.opts || {}) } } : base;
    setForm({ ...cfg, step: METHOD_BY_ID[cfg.method]?.step || 1 });
  }, [open, initialTarget, preset, settings]);

  if (!form) return null;
  const update = patch => setForm(f => ({ ...f, ...patch }));
  const unit = METHOD_BY_ID[form.method]?.unit || 'rencontres';
  const warnings = target ? [
    !isAvailableIn(target, form.game) && `${target.name} n'apparaît pas dans le Pokédex de ${GAME_BY_ID[form.game]?.short}.`,
    isLockedIn(target, form.game) && `${target.name} est probablement Shiny Lock dans ce jeu.`
  ].filter(Boolean) : [];

  const start = () => {
    createHunt({ targetId: target.key, ...form });
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

          {warnings.map(w => (
            <p key={w} className="flex gap-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {w}
            </p>
          ))}

          <OddsConfig charmFor={id => hasCharm(settings, id)} value={form} onChange={update} />

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Pas (+x ${unit})`}>
              <input type="number" inputMode="numeric" min="1" max="100" className="input font-mono" value={form.step}
                onChange={e => update({ step: Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)) })} />
            </Field>
            <Field label="Compteur de départ">
              <input type="number" inputMode="numeric" min="0" className="input font-mono" value={form.count}
                onChange={e => update({ count: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
            </Field>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            50 % de chances d'avoir le shiny après <strong className="text-slate-200">{fmtNumber(encountersFor(form, 0.5))}</strong> {unit},
            90 % après <strong className="text-slate-200">{fmtNumber(encountersFor(form, 0.9))}</strong>.
          </p>
        </div>
      )}
    </Sheet>
  );
}
