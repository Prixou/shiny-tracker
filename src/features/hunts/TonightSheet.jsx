import { useMemo, useState } from 'react';
import { Moon, Sparkles } from 'lucide-react';
import { useActions, useAppState, useShinies } from '../../state/StoreProvider.jsx';
import { useNav } from '../../state/nav.jsx';
import { useEncounters } from '../../state/encounters.js';
import { bestOptionsPrefs } from '../../domain/settings.js';
import { bankOpen } from '../../domain/bank.js';
import { personalPace } from '../../domain/pace.js';
import { TONIGHT_HOURS, TONIGHT_PLATFORMS, defaultPlatforms, rankTonight, tonightCandidates, tonightSessions } from '../../domain/tonight.js';
import { Sheet, Segmented, Field } from '../../ui/index.js';
import TonightSession from './TonightSession.jsx';

const PLATFORM_LABELS = { switch: 'Switch', '3ds': '3DS', ds: 'DS', gba: 'GBA' };
const HOUR_LABELS = { 0.5: '30 min', 1: '1 h', 2: '2 h', 3: '3 h' };

/**
 * « Que chasser ce soir ? » : selon le temps disponible et les consoles à portée, les sessions (jeu + méthode)
 * où l'on a le plus de chances de trouver un shiny manquant, au meilleur taux de ses jeux et à son rythme.
 */
export default function TonightSheet({ onClose }) {
  const data = useEncounters(true);
  const shinies = useShinies();
  const { settings, hunts, wishlist, saved } = useAppState(s => ({ settings: s.settings, hunts: s.hunts, wishlist: s.wishlist, saved: s.ui.tonight }));
  const { setUiValue } = useActions();
  const { openNewHunt } = useNav();
  const [shown, setShown] = useState(4);
  const hours = TONIGHT_HOURS.includes(saved?.hours) ? saved.hours : 1;
  const platforms = saved?.platforms?.length ? saved.platforms : defaultPlatforms(settings.myGames);
  const save = patch => { setUiValue('tonight', { hours, platforms, ...patch }); setShown(4); };
  const togglePlatform = pl => {
    const next = platforms.includes(pl) ? platforms.filter(x => x !== pl) : [...platforms, pl];
    if (next.length) save({ platforms: TONIGHT_PLATFORMS.filter(x => next.includes(x)) });
  };

  const ready = data && !data.error;
  // Le calcul lourd (meilleures options de chaque Pokémon) ne dépend ni du temps ni des consoles.
  const candidates = useMemo(() => (ready ? tonightCandidates(data, { shinies, prefs: bestOptionsPrefs(settings) }) : null), [ready, data, shinies, settings]);
  const personal = useMemo(() => personalPace(hunts), [hunts]);
  const sessions = useMemo(() => (candidates ? tonightSessions(rankTonight(candidates, { hours, platforms, personal, wishlist, bankTime: bankOpen() })) : null),
    [candidates, hours, platforms, personal, wishlist]);

  return (
    <Sheet open onClose={onClose} title="Que chasser ce soir ?" subtitle="Selon ton temps et tes consoles" icon={<Moon className="w-5 h-5" />}>
      <div className="space-y-4">
        <Field group label="Temps disponible">
          <Segmented value={String(hours)} onChange={v => save({ hours: Number(v) })} options={TONIGHT_HOURS.map(h => ({ id: String(h), label: HOUR_LABELS[h] }))} />
        </Field>
        <Field group label="Consoles à portée de main">
          <div className="grid grid-cols-4 gap-1.5">
            {TONIGHT_PLATFORMS.map(pl => (
              <button key={pl} onClick={() => togglePlatform(pl)} aria-pressed={platforms.includes(pl)}
                className={`min-h-11 rounded-xl border text-sm font-bold ${platforms.includes(pl) ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                {PLATFORM_LABELS[pl]}
              </button>
            ))}
          </div>
        </Field>
        <p className="text-xs text-slate-500 leading-relaxed">
          Classé par chance de trouver le shiny dans ce temps, au meilleur taux de tes jeux et à ton rythme (sinon un rythme moyen).
          Bonus : évènements en cours, objectifs ⭐ et shiny à chasser avant la fermeture de la Banque. Touche un Pokémon pour lancer la chasse.
        </p>

        {data?.error && <p className="text-sm text-rose-300">Données de lieux indisponibles hors ligne : ouvre l'app une fois connecté.</p>}
        {!data && <div className="py-10 flex justify-center"><Sparkles className="w-7 h-7 text-amber-400 animate-spin" aria-label="Calcul des suggestions" /></div>}
        {sessions && !sessions.length && <p className="text-sm text-slate-400 py-6 text-center">Rien à chasser sur ces consoles dans tes jeux : coche d'autres consoles ou complète « Mes jeux ».</p>}
        {sessions?.slice(0, shown).map(s => (
          <TonightSession key={s.id} session={s} hours={hours} onHunt={o => openNewHunt(o.p.key, o.option.cfg)} />
        ))}
        {sessions && sessions.length > shown && (
          <button onClick={() => setShown(n => n + 4)} className="btn-secondary w-full">Autres idées ({sessions.length - shown})</button>
        )}
      </div>
    </Sheet>
  );
}
