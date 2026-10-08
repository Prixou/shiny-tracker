import { useMemo } from 'react';
import { MapPin, Timer, Check, Lock } from 'lucide-react';
import { useAppState, useShinies } from '../../state/StoreProvider.jsx';
import { useEncounters } from '../../state/encounters.js';
import { useNav } from '../../state/nav.jsx';
import { GAME_BY_ID } from '../../data/games.js';
import { zonesOf, zoneProgress, isMissingIn, huntConfigIn, canHuntIn } from '../../domain/zones.js';
import { bestOptionsPrefs, hasCharm } from '../../domain/settings.js';
import { Sheet, Sprite } from '../../ui/index.js';

// Ordre d'affichage : shiny manquants d'abord, puis déjà obtenus, puis Shiny Lock.
const rank = (e, shinies, gameId) => (canHuntIn(gameId) && isMissingIn(e, shinies, gameId) ? 0 : shinies[e.p.key] ? 1 : 2);

/** Pokémon d'une zone d'un jeu : shiny manquants en premier, fiche et chasse pré-réglée d'un geste. */
export default function ZoneSheet({ gameId, zoneName, onClose }) {
  const data = useEncounters();
  const shinies = useShinies();
  const settings = useAppState(s => s.settings);
  const { openPokemon, openNewHunt } = useNav();
  const game = GAME_BY_ID[gameId];
  const zone = useMemo(() => (data ? zonesOf(data, gameId).find(z => z.name === zoneName) : null), [data, gameId, zoneName]);
  const huntable = canHuntIn(gameId); // pas de shiny dans Rouge / Bleu / Jaune
  const progress = zone && huntable ? zoneProgress(zone, shinies, gameId) : null;
  const rows = zone ? [...zone.encounters].sort((a, b) => rank(a, shinies, gameId) - rank(b, shinies, gameId)) : [];

  const hunt = p => openNewHunt(p.key, huntConfigIn(p, gameId, data, bestOptionsPrefs(settings), hasCharm(settings, gameId)));

  return (
    <Sheet open onClose={onClose} title={zoneName} icon={<MapPin className="w-5 h-5" />}
      subtitle={`${game?.icon} ${game?.short}${!huntable ? ' · pas de shiny dans ce jeu' : progress ? ` · ${progress.missing ? `${progress.missing} shiny manquant${progress.missing > 1 ? 's' : ''}` : 'complète'}` : ''}`}>
      {!zone ? (
        <div className="h-40 rounded-3xl bg-slate-950 border border-slate-800 animate-pulse" />
      ) : (
        <ul className="space-y-1">
          {rows.map(e => {
            const caught = !!shinies[e.p.key];
            const missing = huntable && isMissingIn(e, shinies, gameId);
            return (
              <li key={e.p.key} className="flex items-center gap-2">
                <button onClick={() => openPokemon(e.p.key)} className="flex-1 min-w-0 flex items-center gap-3 min-h-14 text-left rounded-2xl active:bg-slate-800/60">
                  <Sprite pokemon={e.p} className={`w-12 h-12 shrink-0 ${caught || missing || !huntable ? '' : 'opacity-50 grayscale'}`} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-100">
                      <span className="truncate">{e.p.name}</span>
                      {caught ? <Check className="w-4 h-4 shrink-0 text-emerald-400" aria-label="Déjà shiny" />
                        : missing ? <span className="w-2 h-2 shrink-0 rounded-full bg-amber-400" aria-label="Shiny manquant" />
                          : huntable ? <Lock className="w-3.5 h-3.5 shrink-0 text-rose-400" aria-label="Shiny Lock dans ce jeu" /> : null}
                    </span>
                    <span className="block text-[11px] text-slate-400 truncate">
                      {e.methods.join(' · ')} · Nv. {e.minLevel === e.maxLevel ? e.minLevel : `${e.minLevel}–${e.maxLevel}`}{e.chance ? ` · ${e.chance} %` : ''}
                    </span>
                  </span>
                </button>
                {missing && (
                  <button onClick={() => hunt(e.p)} className="icon-btn w-11 h-11 bg-slate-950 border border-slate-800" aria-label={`Chasser ${e.p.name}`}>
                    <Timer className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
