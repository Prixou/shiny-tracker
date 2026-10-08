import { Gamepad2, Sparkles, Check } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { GAMES, PLATFORMS } from '../data/games.js';
import { hasCharm } from '../lib/myGames.js';
import { Sheet } from './ui.jsx';
import { feedback } from '../lib/hooks.js';

/** Jeux possédés et Charme Chroma jeu par jeu. */
export default function MyGamesSheet({ open, onClose }) {
  const { settings, setSettings } = useStore();
  const mine = new Set(settings.myGames || []);

  const toggleGame = id => {
    const next = new Set(mine);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSettings({ myGames: GAMES.filter(g => next.has(g.id)).map(g => g.id) });
    feedback.tap();
  };
  const toggleCharm = id => {
    setSettings({ charmGames: { ...(settings.charmGames || {}), [id]: !hasCharm(settings, id) } });
    feedback.tap();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Mes jeux" subtitle={mine.size ? `${mine.size} jeu${mine.size > 1 ? 'x' : ''} coché${mine.size > 1 ? 's' : ''}` : 'Aucun jeu coché : tous les jeux sont proposés'} icon={<Gamepad2 className="w-5 h-5" />}>
      <div className="space-y-5">
        <p className="text-sm text-slate-400 leading-relaxed">
          Coche les jeux que tu possèdes et indique où tu as le Charme Chroma. Les meilleures options, les nouvelles chasses, le filtre « Dans mes jeux » du Pokédex et l'assistant en tiennent compte.
        </p>
        {PLATFORMS.map(pl => {
          const games = GAMES.filter(g => g.platform === pl.id && g.id !== 'other');
          if (!games.length) return null;
          return (
            <section key={pl.id} className="space-y-2">
              <div className="label-caps">{pl.name}</div>
              {games.map(g => {
                const owned = mine.has(g.id);
                const charm = hasCharm(settings, g.id);
                return (
                  <div key={g.id} className={`flex items-center gap-2 p-1.5 pl-3 rounded-2xl border ${owned ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950 border-slate-800'}`}>
                    <button onClick={() => toggleGame(g.id)} aria-pressed={owned} className="flex-1 min-w-0 flex items-center gap-3 min-h-11 text-left">
                      <span className={`w-6 h-6 shrink-0 rounded-lg border flex items-center justify-center ${owned ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600'}`}>
                        {owned && <Check className="w-4 h-4" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-100 leading-snug line-clamp-2">{g.icon} {g.name}</span>
                      </span>
                    </button>
                    {g.charm > 0 && (
                      <button onClick={() => toggleCharm(g.id)} aria-pressed={charm} aria-label={`Charme Chroma dans ${g.short}`}
                        className={`shrink-0 min-h-11 px-3 rounded-xl border text-xs font-black flex items-center gap-1.5 ${charm ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                        <Sparkles className="w-3.5 h-3.5" /> Charme
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </Sheet>
  );
}
