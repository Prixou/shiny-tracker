import { useState } from 'react';
import { Star, Timer, Compass, ExternalLink, Sparkles, ShieldAlert, Crown, Trash2, Check } from 'lucide-react';
import { useStore, huntTotal } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { getPokemon, artworkUrl } from '../data/pokedex.js';
import { REGION_BY_ID } from '../data/constants.js';
import { getHuntingTip, padId, formatDate, fmtNumber, fmtOdds, formatDuration, getLuckTier } from '../lib/utils.js';
import { feedback } from '../lib/hooks.js';
import { Sheet, TypeBadge, Sprite, useToast, useConfirm } from './ui.jsx';
import CaptureForm from './CaptureForm.jsx';

export default function PokemonSheet({ pokemonKey, onClose }) {
  const p = pokemonKey ? getPokemon(pokemonKey) : null;
  return (
    <Sheet open={!!p} onClose={onClose} wide>
      {p && <PokemonDetails key={p.key} p={p} onClose={onClose} />}
    </Sheet>
  );
}

function PokemonDetails({ p, onClose }) {
  const { shinies, wishlist, hunts, markCaught, removeShiny, updateShiny, toggleWish } = useStore();
  const { openNewHunt, goTo, openPokemon } = useNav();
  const { setUiValue } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [shinyView, setShinyView] = useState(true);
  const rec = shinies[p.key];
  const wished = !!wishlist[p.key];
  const tip = getHuntingTip(p);
  const region = REGION_BY_ID[p.region];
  const relatedHunts = hunts.filter(h => h.targetId === p.key && h.status === 'active');
  const luck = rec ? getLuckTier(rec.count, rec.odds) : null;

  const onToggleCaught = async () => {
    if (rec) {
      const ok = await confirm({ title: `Retirer ${p.name} ?`, message: 'Le Pokémon repassera en « non capturé » et ses détails de capture seront effacés.', confirmLabel: 'Retirer', danger: true });
      if (!ok) return;
      removeShiny(p.key);
      toast(`${p.name} retiré`, { type: 'info', action: { label: 'Annuler', onClick: () => { markCaught(p.key); updateShiny(p.key, rec); } } });
    } else {
      markCaught(p.key);
      feedback.success();
      toast(`${p.name} shiny capturé ✨`);
    }
  };

  return (
    <div className="space-y-5 -mt-1">
      <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border border-slate-800 overflow-hidden">
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          <div>
            <div className="text-xs font-mono font-black text-amber-400">{padId(p.id)}</div>
            <div className="text-[11px] text-slate-400">{region?.icon} {region?.name} · Gen {p.gen}</div>
          </div>
          <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-[11px] font-bold">
            <button onClick={() => setShinyView(false)} className={`px-2.5 py-1.5 rounded-lg ${!shinyView ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Normal</button>
            <button onClick={() => setShinyView(true)} className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${shinyView ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}><Sparkles className="w-3 h-3" />Shiny</button>
          </div>
        </div>
        <div className="flex justify-center pt-12 pb-4">
          <Sprite
            src={artworkUrl(p, shinyView)}
            alt={p.name}
            pixel={false}
            loading="eager"
            className={`w-52 h-52 sm:w-60 sm:h-60 animate-float ${shinyView ? 'drop-shadow-[0_0_24px_rgba(245,158,11,0.35)]' : ''}`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-white leading-tight">{p.name}</h2>
            <p className="text-sm text-slate-500">{p.enName}</p>
          </div>
          <button onClick={() => { toggleWish(p.key); feedback.tap(); }} className={`icon-btn border ${wished ? 'bg-amber-500/15 border-amber-500/50 text-amber-400' : 'bg-slate-950 border-slate-800'}`} aria-label={wished ? 'Retirer des objectifs' : 'Ajouter aux objectifs'} aria-pressed={wished}>
            <Star className={`w-5 h-5 ${wished ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.types.map(t => <TypeBadge key={t} type={t} />)}
          {p.isLegendary && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"><Crown className="w-3.5 h-3.5" />Légendaire</span>}
          {p.isMythical && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">Fabuleux</span>}
          {p.isStarter && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Starter</span>}
          {p.isShinyLocked && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"><ShieldAlert className="w-3.5 h-3.5" />Shiny Lock</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onToggleCaught} className={rec ? 'btn-secondary' : 'btn-primary'}>
          {rec ? <><Trash2 className="w-4 h-4" /> Retirer</> : <><Check className="w-4 h-4" /> Capturé ✨</>}
        </button>
        <button onClick={() => { onClose(); openNewHunt(p.key); }} className="btn-secondary">
          <Timer className="w-4 h-4" /> Chasser
        </button>
      </div>

      {relatedHunts.length > 0 && (
        <div className="space-y-2">
          {relatedHunts.map(h => (
            <button key={h.id} onClick={() => { setUiValue('activeHuntId', h.id); onClose(); goTo('hunts'); }}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left">
              <span className="flex items-center gap-2 text-sm font-bold text-emerald-300"><Timer className="w-4 h-4" /> Chasse en cours</span>
              <span className="text-sm font-mono font-black text-emerald-200">{fmtNumber(huntTotal(h))} renc.</span>
            </button>
          ))}
        </div>
      )}

      {rec && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="label-caps">Ma capture</h3>
            <span className="text-xs text-slate-500">{formatDate(rec.date)}</span>
          </div>
          {rec.count > 0 && (
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${luck.bg}`}>
              <span className="text-2xl">{luck.emoji}</span>
              <div className="min-w-0">
                <div className={`text-sm font-black ${luck.color}`}>{luck.name}</div>
                <div className="text-xs text-slate-300">
                  {fmtNumber(rec.count)} rencontres · {fmtOdds(rec.odds)}{rec.elapsedMs ? ` · ${formatDuration(rec.elapsedMs, { short: true })}` : ''}
                </div>
              </div>
            </div>
          )}
          <CaptureForm value={rec} onChange={patch => updateShiny(p.key, patch)} />
        </section>
      )}

      {tip && (
        <section className="p-4 rounded-3xl bg-slate-950 border border-amber-500/25 space-y-3">
          <div className="flex items-center gap-2 label-caps text-amber-400"><Compass className="w-4 h-4" /> Conseil de chasse</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-500">Jeu conseillé</div>
              <div className="font-bold text-slate-100">{tip.game}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-500">Méthode</div>
              <div className="font-bold text-amber-300">{tip.method}</div>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">💡 {tip.tip}</p>
        </section>
      )}

      {p.isForm ? (
        <button onClick={() => openPokemon(String(p.baseId))} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left">
          <Sprite pokemon={getPokemon(String(p.baseId))} className="w-12 h-12" />
          <span className="text-sm font-bold text-slate-300">Voir la forme de base : {getPokemon(String(p.baseId))?.name}</span>
        </button>
      ) : null}

      <a href={`https://www.pokepedia.fr/${encodeURIComponent((getPokemon(String(p.baseId))?.name || p.name).replace(/ /g, '_'))}`} target="_blank" rel="noopener noreferrer"
        className="btn-ghost w-full">
        <ExternalLink className="w-4 h-4" /> Voir sur Poképédia
      </a>
    </div>
  );
}
