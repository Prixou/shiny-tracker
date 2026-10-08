import { useMemo, useState } from 'react';
import { Hourglass, Timer, ChevronDown, Check, ListPlus, Star, Lightbulb, Send, Info } from 'lucide-react';
import { useActions, useAppState, useShinies } from '../../state/StoreProvider.jsx';
import { useEncounters } from '../../state/encounters.js';
import { useNav } from '../../state/nav.jsx';
import { getPokemon } from '../../data/pokedex.js';
import { GAME_BY_ID } from '../../data/games.js';
import { BANK_DEADLINE, MIN_GAIN, bankDaysLeft, bankPriorities, groupByMethod, viaBank } from '../../domain/bank.js';
import { bestOptionsPrefs } from '../../domain/settings.js';
import { fmtOdds, formatDate } from '../../lib/format.js';
import { feedback } from '../../lib/feedback.js';
import { Sheet, Sprite, Segmented } from '../../ui/index.js';

const NONE = {};

const LIST_NAME = 'Avant la Banque';
const deadlineFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CHECKLIST = [
  { id: 'apps', label: 'Pokémon Banque et Poké Transporter sont installés sur ma 3DS', desc: 'Ils ne peuvent plus être téléchargés : ne les supprime pas.' },
  { id: 'premium', label: 'Abonnement Premium de HOME prévu pour les mois de transfert', desc: 'Obligatoire pour faire passer la Banque vers HOME.' },
  { id: 'test', label: 'Un premier transfert Banque → HOME a été fait', desc: 'Pour vérifier que tout fonctionne bien avant la dernière ligne droite.' },
  { id: 'backup', label: 'Mes cartouches et sauvegardes sont sauvegardées (PKSM, Checkpoint)', desc: 'Pour garder ce qui restera sur 3DS après la fermeture.' },
  { id: 'monthly', label: 'Je transfère au fur et à mesure (une fois par mois)', desc: 'Pas tout en février : les serveurs risquent d\'être saturés.' }
];

const TIPS = [
  'Ultra-Soleil / Ultra-Lune : dans les Ultra-Brèches les plus rares, après 5 000 années-lumière, les Pokémon non légendaires ont jusqu\'à environ 36 % de chances d\'être shiny.',
  'X / Y, Rubis Oméga / Saphir Alpha, Soleil / Lune : la Masuda avec Charme Chroma donne 1/512, comme sur Switch, pour toutes les espèces de ces jeux.',
  'Après la fermeture, tu pourras continuer à chasser sur 3DS pour le plaisir : tes shiny resteront dans tes jeux et tes sauvegardes.'
];

function PriorityRow({ e, wish }) {
  const { openNewHunt, openPokemon } = useNav();
  const game = GAME_BY_ID[e.best.game];
  return (
    <li className="flex items-center gap-2">
      <button onClick={() => openPokemon(e.p.key)} className="flex-1 min-w-0 flex items-center gap-2.5 min-h-12 text-left rounded-2xl active:bg-slate-800/60">
        <Sprite pokemon={e.p} className="w-11 h-11 shrink-0" />
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-sm font-bold text-slate-100 truncate">
            {wish && <Star className="w-3.5 h-3.5 shrink-0 fill-amber-400 text-amber-400" />}{e.p.name}
          </span>
          <span className="block text-[11px] text-slate-400 truncate">
            {game?.short} {fmtOdds(e.best.odds)}{e.notOwned ? ' (pas à toi)' : ''}{e.switchBest ? ` · Switch ${fmtOdds(e.switchBest.odds)}` : ''}
          </span>
        </span>
      </button>
      <span className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-black ${Number.isFinite(e.gain) ? 'bg-sky-500/15 text-sky-300' : 'bg-amber-500/20 text-amber-300'}`}>
        {Number.isFinite(e.gain) ? `×${e.gain >= 10 ? Math.round(e.gain) : e.gain.toFixed(1).replace('.', ',')}` : e.switchElsewhere ? 'hors tes jeux' : 'seul moyen'}
      </span>
      <button onClick={() => openNewHunt(e.p.key, e.best.cfg)} className="icon-btn w-11 h-11 bg-slate-950 border border-slate-800" aria-label={`Chasser ${e.p.name}`}>
        <Timer className="w-4 h-4" />
      </button>
    </li>
  );
}

function Group({ group, open, onToggle, wishlist, onAddToList }) {
  const game = GAME_BY_ID[group.game];
  const items = [...group.items].sort((a, b) => (wishlist[b.p.key] ? 1 : 0) - (wishlist[a.p.key] ? 1 : 0));
  return (
    <section className="rounded-2xl bg-slate-950 border border-slate-800">
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-3 min-h-14 px-3 text-left">
        <span className="text-xl shrink-0" aria-hidden="true">{game?.icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-black text-white truncate">{game?.short} · {group.label}</span>
          <span className="block text-xs text-slate-400">{group.items.length} Pokémon · jusqu'à {fmtOdds(group.odds)}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <ul className="space-y-1">{items.map(e => <PriorityRow key={e.p.key} e={e} wish={!!wishlist[e.p.key]} />)}</ul>
          <button onClick={() => onAddToList(group.items.map(e => e.p.key))} className="btn-secondary w-full min-h-11 text-xs">
            <ListPlus className="w-4 h-4" /> Ajouter à ma liste « {LIST_NAME} »
          </button>
        </div>
      )}
    </section>
  );
}

/** Plan « Avant la fermeture de la Banque » : compte à rebours, check-list, priorités et transferts. */
export default function BankPlanSheet({ open, onClose }) {
  const shinies = useShinies();
  const { wishlist, settings, catches, lists, checklist } = useAppState(s => ({
    wishlist: s.wishlist, settings: s.settings, catches: s.catches, lists: s.lists, checklist: s.ui.bankChecklist || NONE
  }));
  const { setUiValue, markInHome, createList, setInList } = useActions();
  const data = useEncounters(open);
  const [view, setView] = useState('only');
  const [openGroups, setOpenGroups] = useState({});
  const [showAllTransfers, setShowAllTransfers] = useState(false);

  const priorities = useMemo(
    () => (data ? bankPriorities(data, { shinies, prefs: bestOptionsPrefs(settings) }) : null),
    [data, shinies, settings]
  );
  const groups = useMemo(() => (priorities ? groupByMethod(priorities[view]) : []), [priorities, view]);
  // Le premier groupe est ouvert par défaut, pour chaque onglet.
  const openGroup = openGroups[view] !== undefined ? openGroups[view] : groups[0]?.id || null;
  const toggleGroup = id => setOpenGroups(o => ({ ...o, [view]: openGroup === id ? null : id }));

  const toTransfer = useMemo(
    () => catches.filter(c => viaBank(c.game) && !c.inHome).sort((a, b) => a.timestamp - b.timestamp),
    [catches]
  );
  const days = bankDaysLeft();
  const doneChecks = CHECKLIST.filter(c => checklist[c.id]).length;

  const toggleCheck = id => {
    setUiValue('bankChecklist', { ...checklist, [id]: !checklist[id] });
    feedback.tap();
  };
  // Le toast d'annulation confirme l'ajout (« … dans « Avant la Banque » · Annuler »).
  const addToList = keys => {
    const list = lists.find(l => l.name === LIST_NAME);
    if (list) setInList(list.id, keys, true, `${keys.length} Pokémon ajoutés à « ${LIST_NAME} »`);
    else createList({ name: LIST_NAME, emoji: '⏳', keys: Object.fromEntries(keys.map(k => [k, true])) });
    feedback.success();
  };

  return (
    <Sheet open={open} onClose={onClose} full title="Plan Pokémon Banque" subtitle="Avant la fin des transferts vers HOME" icon={<Hourglass className="w-5 h-5" />}>
      <div className="space-y-5">
        <section className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-950 to-slate-950 border border-amber-500/40 space-y-2">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black font-mono text-amber-400 leading-none">{days}</span>
            <span className="text-sm font-bold text-slate-300 mb-1">jour{days > 1 ? 's' : ''} restant{days > 1 ? 's' : ''}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Derniers transferts Pokémon Banque → HOME : <strong className="text-white">{deadlineFmt.format(BANK_DEADLINE)}</strong> (25 février, 19 h heure du Pacifique). Après, les Pokémon des jeux DS, 3DS et Console virtuelle ne pourront plus aller dans HOME.
          </p>
        </section>

        {toTransfer.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="label-caps flex items-center gap-1.5"><Send className="w-4 h-4" /> À transférer ({toTransfer.length})</h3>
              <button onClick={() => markInHome(toTransfer.map(c => c.id), true)} className="text-xs font-bold text-amber-400 min-h-10 px-2">Tout marquer transféré</button>
            </div>
            <p className="text-xs text-slate-400">Tes shiny capturés sur DS/3DS qui ne sont pas encore marqués comme transférés dans HOME.</p>
            <ul className="space-y-1.5">
              {toTransfer.slice(0, showAllTransfers ? toTransfer.length : 5).map(c => {
                const p = getPokemon(c.key);
                return (
                  <li key={c.id} className="flex items-center gap-2.5 pl-1 pr-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <Sprite pokemon={p} className="w-11 h-11 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-slate-100 truncate">{p?.name || c.key}{c.nickname ? ` « ${c.nickname} »` : ''}</span>
                      <span className="block text-[11px] text-slate-400">{GAME_BY_ID[c.game]?.short}{c.date ? ` · ${formatDate(c.date)}` : ''}</span>
                    </span>
                    <button onClick={() => markInHome([c.id], true)} className="shrink-0 min-h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Transféré
                    </button>
                  </li>
                );
              })}
            </ul>
            {toTransfer.length > 5 && (
              <button onClick={() => setShowAllTransfers(v => !v)} className="btn-ghost w-full min-h-10 text-xs">
                {showAllTransfers ? 'Afficher moins' : `Voir les ${toTransfer.length - 5} autres`}
              </button>
            )}
          </section>
        )}

        <section className="space-y-2">
          <h3 className="label-caps flex items-center justify-between">Check-list <span className="normal-case text-slate-500">{doneChecks}/{CHECKLIST.length}</span></h3>
          <ul className="space-y-1.5">
            {CHECKLIST.map(c => (
              <li key={c.id}>
                <button onClick={() => toggleCheck(c.id)} aria-pressed={!!checklist[c.id]} className="w-full flex items-start gap-3 min-h-12 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left">
                  <span className={`w-6 h-6 shrink-0 rounded-lg border flex items-center justify-center mt-0.5 ${checklist[c.id] ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'}`}>
                    {checklist[c.id] && <Check className="w-4 h-4" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-bold ${checklist[c.id] ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{c.label}</span>
                    <span className="block text-xs text-slate-500">{c.desc}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="label-caps">Shiny à chasser en priorité</h3>
          {!priorities ? (
            <div className="h-40 rounded-3xl bg-slate-950 border border-slate-800 animate-pulse" />
          ) : (
            <>
              <Segmented size="sm" value={view} onChange={setView}
                options={[{ id: 'only', label: `Seulement DS/3DS (${priorities.only.length})` }, { id: 'easier', label: `Bien plus faciles (${priorities.easier.length})` }]} />
              <p className="text-xs text-slate-400 leading-relaxed">
                {view === 'only'
                  ? 'Les shiny qui te manquent et que tu ne pourras chasser sur aucun jeu Switch : après la fermeture, ils ne pourront plus rejoindre HOME.'
                  : `Les shiny qui te manquent et qui sont au moins ${MIN_GAIN} fois plus faciles dans tes jeux DS/3DS que dans tes jeux Switch (ou absents de tes jeux Switch).`}
                {settings.myGames?.length ? ' Selon tes jeux (Réglages → Mes jeux).' : ' Coche tes jeux dans Réglages → Mes jeux pour un plan sur mesure.'}
              </p>
              {groups.length === 0 ? (
                <p className="flex gap-2 text-sm text-emerald-300 p-3"><Check className="w-4 h-4 shrink-0 mt-0.5" /> Rien à signaler ici : bravo !</p>
              ) : groups.map(g => (
                <Group key={g.id} group={g} open={openGroup === g.id} onToggle={() => toggleGroup(g.id)} wishlist={wishlist} onAddToList={addToList} />
              ))}
              <p className="flex gap-1.5 text-[11px] text-slate-500"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> D'après les lieux connus de l'app : certains peuvent aussi s'obtenir sur Switch par d'autres moyens (fossiles, raids, dons). Vérifie la fiche avant de te lancer.</p>
            </>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="label-caps flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Conseils</h3>
          <ul className="space-y-2">
            {TIPS.map(t => <li key={t} className="text-sm text-slate-300 leading-relaxed p-3 rounded-2xl bg-slate-950 border border-slate-800">{t}</li>)}
          </ul>
        </section>
      </div>
    </Sheet>
  );
}
