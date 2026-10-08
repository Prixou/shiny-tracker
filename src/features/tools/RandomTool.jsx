import { useEffect, useRef, useState } from 'react';
import { Dices, Star, Timer, Info } from 'lucide-react';
import { useActions, useAppState, useShinies } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { MAIN_DEX, artworkUrl, isAvailableIn } from '../../data/pokedex.js';
import { REGIONS, POKEMON_TYPES } from '../../data/constants.js';
import { isLockedIn } from '../../data/games.js';
import { padId } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Segmented, Sprite, TypeBadge, Toggle, GameOptions } from '../../ui/index.js';

export default function RandomTool() {
  const shinies = useShinies();
  const { wishlist, randomOpts } = useAppState(s => ({ wishlist: s.wishlist, randomOpts: s.ui.randomOpts }));
  const { toggleWish, setUiValue } = useActions();
  const { openNewHunt, openPokemon } = useNav();
  const opts = { pool: 'missing', region: 'all', type: 'all', game: 'all', noLock: true, ...(randomOpts || {}) };
  const setOpts = patch => setUiValue('randomOpts', { ...opts, ...patch });
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const game = opts.game !== 'all' ? opts.game : null;
  const pool = MAIN_DEX.filter(p => {
    if (opts.pool === 'missing' && shinies[p.key]) return false;
    if (opts.pool === 'wish' && !wishlist[p.key]) return false;
    if (opts.region !== 'all' && p.region !== opts.region) return false;
    if (opts.type !== 'all' && !p.types.includes(opts.type)) return false;
    if (game && !isAvailableIn(p, game)) return false;
    if (opts.noLock && isLockedIn(p, game)) return false;
    return true;
  });

  const roll = () => {
    if (!pool.length || rolling) return;
    clearInterval(timer.current);
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks++;
      setRolling(pool[Math.floor(Math.random() * pool.length)]);
      feedback.vibrate(4);
      if (ticks >= 14) {
        clearInterval(timer.current);
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setRolling(null);
        setResult(pick);
        feedback.success();
      }
    }, 70);
  };

  const shown = rolling || result;
  return (
    <div className="space-y-4">
      <div className="card p-5 text-center space-y-4">
        <div className="relative h-56 flex items-center justify-center rounded-3xl bg-gradient-to-b from-amber-500/10 to-slate-950 border border-slate-800">
          {shown ? (
            rolling ? <Sprite pokemon={shown} className="w-40 h-40 blur-[1px] opacity-80" />
              : <Sprite key={shown.key} src={artworkUrl(shown)} pixel={false} loading="eager" className="w-48 h-48 animate-pop-in drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" alt={shown.name} />
          ) : (
            <Dices className="w-16 h-16 text-slate-700" />
          )}
        </div>
        {result && !rolling ? (
          <div className="space-y-2">
            <div className="text-xs font-mono font-black text-amber-400">{padId(result.id)}</div>
            <h2 className="text-2xl font-black text-white">{result.name}</h2>
            <div className="flex justify-center gap-1.5">{result.types.map(t => <TypeBadge key={t} type={t} small />)}</div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button className="btn-secondary px-2" onClick={() => openNewHunt(result.key)}><Timer className="w-4 h-4" /> Chasser</button>
              <button className={`btn-secondary px-2 ${wishlist[result.key] ? 'text-amber-300 border-amber-500/50' : ''}`} onClick={() => { toggleWish(result.key); feedback.tap(); }}>
                <Star className={`w-4 h-4 ${wishlist[result.key] ? 'fill-amber-400' : ''}`} /> Objectif
              </button>
              <button className="btn-secondary px-2" onClick={() => openPokemon(result.key)}><Info className="w-4 h-4" /> Fiche</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">{rolling ? 'Tirage en cours…' : 'Laisse le hasard choisir ta prochaine cible !'}</p>
        )}
        <button onClick={roll} disabled={!pool.length || !!rolling} className="btn-primary w-full min-h-14 text-base">
          <Dices className="w-5 h-5" /> {result ? 'Relancer' : 'Lancer le tirage'}
        </button>
        <p className="text-xs text-slate-500">{pool.length} Pokémon possibles</p>
      </div>

      <div className="card p-4 space-y-4">
        <Segmented size="sm" value={opts.pool} onChange={pool => setOpts({ pool })}
          options={[{ id: 'missing', label: 'Manquants' }, { id: 'wish', label: 'Objectifs' }, { id: 'all', label: 'Tous' }]} />
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={opts.region} onChange={e => setOpts({ region: e.target.value })} aria-label="Région">
            <option value="all">Toutes les régions</option>
            {REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className="input" value={opts.type} onChange={e => setOpts({ type: e.target.value })} aria-label="Type">
            <option value="all">Types</option>
            {POKEMON_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <select className="input" value={opts.game} onChange={e => setOpts({ game: e.target.value })} aria-label="Jeu">
          <option value="all">🎮 Tous les jeux</option>
          <GameOptions filter={g => g.dexes} />
        </select>
        <Toggle checked={opts.noLock} onChange={noLock => setOpts({ noLock })} label="Exclure les Shiny Lock" />
      </div>
    </div>
  );
}
