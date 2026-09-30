import { useState } from 'react';
import { Star, Timer, ExternalLink, Sparkles, ShieldAlert, Crown, Trash2, Plus, ChevronDown, Film, Lock, ListPlus } from 'lucide-react';
import { useStore, huntTotal } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { getPokemon, artworkUrl, animatedUrl, POKEDEX, gamesFor, isPixelArtwork, VARIANT_LABELS } from '../data/pokedex.js';
import { REGION_BY_ID, GAME_BY_ID, METHOD_BY_ID, isLockedIn } from '../data/constants.js';
import { getHuntingTip, padId, formatDate, fmtNumber, fmtOdds, formatDuration, getLuckTier, catchRatio } from '../lib/utils.js';
import { feedback } from '../lib/hooks.js';
import { Sheet, TypeBadge, Sprite, BallIcon, useConfirm } from './ui.jsx';
import CaptureForm from './CaptureForm.jsx';
import EncountersSection from './EncountersSection.jsx';
import BestOptions from './BestOptions.jsx';
import ListsSheet from './ListsSheet.jsx';

export default function PokemonSheet({ pokemonKey, onClose }) {
  const p = pokemonKey ? getPokemon(pokemonKey) : null;
  return (
    <Sheet open={!!p} onClose={onClose} wide>
      {p && <PokemonDetails key={p.key} p={p} onClose={onClose} />}
    </Sheet>
  );
}

function PokemonDetails({ p, onClose }) {
  const { catchesByKey, wishlist, lists, hunts, settings, addCatch, removeCatchesOf, toggleWish, toggleInList, setUiValue } = useStore();
  const { openNewHunt, goTo, openPokemon } = useNav();
  const confirm = useConfirm();
  const [shinyView, setShinyView] = useState(true);
  const [animated, setAnimated] = useState(settings.animatedSprites);
  const [showLists, setShowLists] = useState(false);
  const copies = catchesByKey[p.key] || [];
  const wished = !!wishlist[p.key];
  const tip = getHuntingTip(p);
  const region = REGION_BY_ID[p.region];
  const relatedHunts = hunts.filter(h => h.targetId === p.key && h.status === 'active');
  const family = POKEDEX.filter(x => x.baseId === p.baseId && x.key !== p.key);
  const available = gamesFor(p);
  const pixel = isPixelArtwork(p);

  const onRemoveAll = async () => {
    const ok = await confirm({ title: `Retirer ${p.name} ?`, message: `${copies.length} exemplaire${copies.length > 1 ? 's' : ''} et leurs détails seront supprimés. Tu pourras annuler juste après.`, confirmLabel: 'Retirer', danger: true });
    if (ok) removeCatchesOf(p.key, `${p.name} retiré`);
  };
  const onAdd = () => {
    addCatch(p.key, {}, copies.length ? `Exemplaire de ${p.name} ajouté` : `${p.name} shiny capturé ✨`);
    feedback.success();
  };

  return (
    <div className="space-y-5 -mt-1">
      <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border border-slate-800 overflow-hidden">
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10 gap-2">
          <div>
            <div className="text-xs font-mono font-black text-amber-400">{padId(p.id)}</div>
            <div className="text-[11px] text-slate-400">{region?.icon} {region?.name} · Gen {p.gen}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setAnimated(a => !a)} aria-pressed={animated} aria-label="Sprite animé"
              className={`w-9 h-9 flex items-center justify-center rounded-xl border ${animated ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900/90 border-slate-800 text-slate-400'}`}>
              <Film className="w-4 h-4" />
            </button>
            <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-[11px] font-bold">
              <button onClick={() => setShinyView(false)} className={`px-2.5 py-1.5 rounded-lg ${!shinyView ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Normal</button>
              <button onClick={() => setShinyView(true)} className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${shinyView ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}><Sparkles className="w-3 h-3" />Shiny</button>
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-14 pb-4">
          {animated && !p.spritePath ? (
            <Sprite key={`a${shinyView}`} src={animatedUrl(p, shinyView)} pixel alt={p.name} loading="eager" className="w-40 h-40 sm:w-48 sm:h-48" />
          ) : (
            <Sprite key={`s${shinyView}`} src={artworkUrl(p, shinyView)} alt={p.name} pixel={pixel} loading="eager"
              className={`w-52 h-52 sm:w-60 sm:h-60 animate-float ${shinyView ? 'drop-shadow-[0_0_24px_rgba(245,158,11,0.35)]' : ''}`} />
          )}
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
          {p.isVariant && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">{VARIANT_LABELS[p.variantKind]}</span>}
          {p.isLegendary && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"><Crown className="w-3.5 h-3.5" />Légendaire</span>}
          {p.isMythical && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">Fabuleux</span>}
          {p.isStarter && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Starter</span>}
          {p.isShinyLocked && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"><ShieldAlert className="w-3.5 h-3.5" />Shiny Lock</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onAdd} className={copies.length ? 'btn-secondary' : 'btn-primary'}>
          {copies.length ? <><Plus className="w-4 h-4" /> Un de plus</> : <><Sparkles className="w-4 h-4" /> Capturé ✨</>}
        </button>
        <button onClick={() => { onClose(); openNewHunt(p.key); }} className="btn-secondary">
          <Timer className="w-4 h-4" /> Chasser
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        {lists.map(l => {
          const on = !!l.keys[p.key];
          return (
            <button key={l.id} onClick={() => toggleInList(l.id, p.key)} aria-pressed={on} className={`chip shrink-0 min-h-9 text-xs ${on ? 'chip-on' : 'chip-off'}`}>
              {l.emoji} {l.name}
            </button>
          );
        })}
        <button onClick={() => setShowLists(true)} className="chip chip-off shrink-0 min-h-9 text-xs border-dashed"><ListPlus className="w-3.5 h-3.5" /> {lists.length ? 'Listes' : 'Créer une liste'}</button>
      </div>

      {relatedHunts.map(h => (
        <button key={h.id} onClick={() => { setUiValue('activeHuntId', h.id); onClose(); goTo('hunts'); }}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left">
          <span className="flex items-center gap-2 text-sm font-bold text-emerald-300"><Timer className="w-4 h-4" /> Chasse en cours · {GAME_BY_ID[h.game]?.short}</span>
          <span className="text-sm font-mono font-black text-emerald-200">{fmtNumber(huntTotal(h))}</span>
        </button>
      ))}

      {copies.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="label-caps">Mes exemplaires ({copies.length})</h3>
            <button onClick={onRemoveAll} className="text-xs font-bold text-rose-300 px-2 py-1 rounded-lg active:bg-slate-800 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Tout retirer</button>
          </div>
          {copies.map((c, i) => <CopyCard key={c.id} copy={c} defaultOpen={copies.length === 1 && i === 0} />)}
        </section>
      )}

      {available.length > 0 && (
        <section className="space-y-2">
          <h3 className="label-caps">Disponible dans</h3>
          <div className="flex flex-wrap gap-1.5">
            {available.map(g => {
              const locked = isLockedIn(p, g.id);
              return (
                <span key={g.id} title={locked ? 'Shiny Lock probable dans ce jeu' : g.name}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${locked ? 'bg-slate-950 border-rose-500/30 text-rose-300/80 line-through' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  {g.icon} {g.short}{locked && <Lock className="w-3 h-3" />}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {family.length > 0 && (
        <section className="space-y-2">
          <h3 className="label-caps">Formes et variantes</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {family.map(f => (
              <button key={f.key} onClick={() => openPokemon(f.key)} className="shrink-0 w-20 flex flex-col items-center gap-1 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 active:bg-slate-800">
                <Sprite pokemon={f} className="w-14 h-14" />
                <span className="w-full text-[10px] font-bold text-slate-300 text-center leading-tight line-clamp-2">{f.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <BestOptions pokemon={p} fallbackTip={tip?.tip} onHunt={cfg => { onClose(); openNewHunt(p.key, cfg); }} />

      <EncountersSection pokemon={p} />

      <a href={`https://www.pokepedia.fr/${encodeURIComponent((getPokemon(String(p.baseId))?.name || p.name).replace(/ /g, '_'))}`} target="_blank" rel="noopener noreferrer"
        className="btn-ghost w-full">
        <ExternalLink className="w-4 h-4" /> Voir sur Poképédia
      </a>

      <ListsSheet open={showLists} onClose={() => setShowLists(false)} />
    </div>
  );
}

function CopyCard({ copy, defaultOpen }) {
  const { updateCatch, removeCatch } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const ratio = catchRatio(copy);
  const luck = getLuckTier(ratio);
  const game = GAME_BY_ID[copy.game];
  return (
    <div className={`rounded-2xl border ${open ? 'border-amber-500/40 bg-slate-950' : 'border-slate-800 bg-slate-950'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 text-left" aria-expanded={open}>
        <BallIcon id={copy.ball} className="w-7 h-7" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-slate-100 truncate">
            {copy.nickname || formatDate(copy.date)}{copy.gender === 'm' ? ' ♂' : copy.gender === 'f' ? ' ♀' : ''}{copy.alpha ? ' · Baron' : ''}
          </span>
          <span className="block text-xs text-slate-500 truncate">
            {copy.nickname ? `${formatDate(copy.date)} · ` : ''}{game ? `${game.icon} ${game.short} · ` : ''}{METHOD_BY_ID[copy.method]?.name}
            {copy.count ? ` · ${fmtNumber(copy.count)} renc.` : ''}
          </span>
        </span>
        <span className="text-lg" title={luck.name}>{luck.emoji}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          {ratio != null && (
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${luck.bg}`}>
              <span className="text-2xl">{luck.emoji}</span>
              <div className="min-w-0">
                <div className={`text-sm font-black ${luck.color}`}>{luck.name}</div>
                <div className="text-xs text-slate-300">
                  {fmtNumber(copy.count)} rencontres · {fmtOdds(copy.odds)}{copy.elapsedMs ? ` · ${formatDuration(copy.elapsedMs, { short: true })}` : ''}
                </div>
              </div>
            </div>
          )}
          <CaptureForm value={copy} onChange={patch => updateCatch(copy.id, patch)} />
          <button onClick={() => removeCatch(copy.id)} className="btn-ghost w-full text-rose-300"><Trash2 className="w-4 h-4" /> Supprimer cet exemplaire</button>
        </div>
      )}
    </div>
  );
}
