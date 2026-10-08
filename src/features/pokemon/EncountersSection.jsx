import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { GAME_BY_ID } from '../../data/games.js';
import { useEncounters } from '../../state/encounters.js';

const METHOD_NAMES = {
  walk: 'Herbes / grotte', surf: 'Surf', 'old-rod': 'Canne', 'good-rod': 'Super Canne', 'super-rod': 'Méga Canne',
  'rock-smash': 'Éclate-Roc', headbutt: 'Coup d\'Boule', gift: 'Cadeau', 'gift-egg': 'Œuf offert', 'only-one': 'Rencontre unique',
  'dark-grass': 'Herbes sombres', 'grass-spots': 'Herbes qui bougent', 'cave-spots': 'Nuage de poussière', 'bridge-spots': 'Ombre sur un pont',
  'surf-spots': 'Remous (surf)', 'super-rod-spots': 'Remous (pêche)', 'yellow-flowers': 'Fleurs jaunes', 'purple-flowers': 'Fleurs violettes',
  'red-flowers': 'Fleurs rouges', 'rough-terrain': 'Terrain accidenté', pokeflute: 'Poké Flûte', 'sos-encounter': 'Appel à l\'aide',
  'island-scan': 'Scan des îles', 'npc-trade': 'Échange', seaweed: 'Algues', 'roaming-grass': 'Errant (herbes)', 'roaming-water': 'Errant (eau)',
  'devon-scope': 'Devon Scope', 'squirt-bottle': 'Carapuce à O', 'wailmer-pail': 'Wailmerrosoir', 'berry-piles': 'Tas de baies',
  'bubbling-spots': 'Bulles', ambush: 'Embuscade', 'sweet-scent': 'Doux Parfum', 'horde': 'Horde', 'poke-radar': 'Poké Radar',
  'sv-wild': 'Sauvage', 'pla-wild': 'Sauvage', 'pla-distortion': 'Distorsion spatiale', 'pla-landmark': 'Arbre / minerai',
  'pla-mo': 'Apparition massive', 'pla-mmo': 'Mégapparition', 'honey-tree': 'Arbre à Miel', underground: 'Grands Souterrains',
  'za-wild': 'Sauvage', 'za-hyperspace': 'Hyperespace',
  static: 'Rencontre fixe', overworld: 'Visible sur la carte', 'overworld-special': 'Apparition rare', 'overworld-flying': 'En vol',
  'overworld-flying-special': 'En vol (rare)', 'overworld-water': 'Sur l\'eau', 'overworld-water-special': 'Sur l\'eau (rare)',
  'overworld-dirt': 'Terrain (dans le sol)', sos: 'Appel à l\'aide', 'sos-from-bubbling-spot': 'Appel à l\'aide (remous)',
  'max-raid': 'Raid Dynamax', wanderer: 'Errant', 'wanderer-water': 'Errant (eau)', 'hidden-grotto': 'Trouée Cachée',
  'headbutt-low': 'Coup d\'Boule', 'headbutt-normal': 'Coup d\'Boule', 'headbutt-high': 'Coup d\'Boule (rare)',
  'sky-ambush': 'Embuscade (ciel)', 'ground-ambush': 'Embuscade (sol)', 'ceiling-ambush': 'Embuscade (plafond)',
  'trash-can-ambush': 'Poubelle', 'rustling-bush-ambush': 'Buisson qui bouge', 'berry-trees': 'Arbre à baies',
  'feebas-tile-fishing': 'Pêche (Barpau)', 'pokemon-ranger': 'Pokémon Ranger', 'pokemon-channel-pal': 'Pokémon Channel',
  'colosseum-bonus-disc-jpn': 'Disque bonus', 'colosseum-bonus-disc-us': 'Disque bonus'
};
const methodName = m => METHOD_NAMES[m] || m.replace(/-/g, ' ');


// Lieux de capture issus de PokéAPI (données complètes surtout jusqu'à la Gen 7).
export default function EncountersSection({ pokemon }) {
  const data = useEncounters();
  const [openGame, setOpenGame] = useState(null);

  if (!data) return <div className="h-16 rounded-2xl bg-slate-950 border border-slate-800 animate-pulse" />;
  const rows = data.encounters?.[pokemon.baseId] || [];
  const byGame = new Map();
  for (const [g, loc, m, min, max, chance] of rows) {
    const game = data.games[g];
    if (!byGame.has(game)) byGame.set(game, []);
    byGame.get(game).push({ loc: data.locations[loc], method: methodName(data.methods[m]), min, max, chance });
  }
  const games = [...byGame.keys()].sort((a, b) => (GAME_BY_ID[b]?.gen || 0) - (GAME_BY_ID[a]?.gen || 0));

  return (
    <section className="space-y-2">
      <h3 className="label-caps flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Où le trouver</h3>
      {data.error || games.length === 0 ? (
        <p className="text-sm text-slate-500 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          Aucun lieu de rencontre sauvage connu{' (évolution, œuf, échange, raid ou évènement)'}.
        </p>
      ) : games.map(g => {
        const list = byGame.get(g).sort((a, b) => b.chance - a.chance);
        const open = openGame === g;
        return (
          <div key={g} className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
            <button onClick={() => setOpenGame(open ? null : g)} className="w-full flex items-center justify-between gap-2 px-3 min-h-11 text-sm font-bold text-slate-200" aria-expanded={open}>
              <span className="truncate">{GAME_BY_ID[g]?.icon} {GAME_BY_ID[g]?.name}</span>
              <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">{list.length} lieu{list.length > 1 ? 'x' : ''}<ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} /></span>
            </button>
            {open && (
              <ul className="border-t border-slate-800 divide-y divide-slate-800/70">
                {list.map((r, i) => (
                  <li key={i} className="px-3 py-2 text-xs flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-200 truncate">{r.loc}</span>
                      <span className="text-slate-500">{r.method} · Nv. {r.min === r.max ? r.min : `${r.min}–${r.max}`}</span>
                    </span>
                    {r.chance > 0 && <span className="shrink-0 font-mono text-slate-400">{r.chance} %</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
