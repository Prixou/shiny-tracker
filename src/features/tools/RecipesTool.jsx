import { useState } from 'react';
import { Info, Search } from 'lucide-react';
import { TYPE_BY_ID } from '../../data/constants.js';
import { normalize } from '../../lib/text.js';
import { Segmented, TypeBadge } from '../../ui/index.js';

// Sandwich « Brillance + Rencontre + Titre Nv. 3 » : 1 ingrédient + 2 Herba Mystica.
const SANDWICHES = [
  { type: 'normal', ingredient: 'Chorizo', herbs: ['salée', 'salée'] },
  { type: 'fire', ingredient: 'Basilic', herbs: ['salée', 'sucrée'] },
  { type: 'water', ingredient: 'Concombre', herbs: ['salée', 'salée'] },
  { type: 'grass', ingredient: 'Laitue', herbs: ['salée', 'acide'] },
  { type: 'electric', ingredient: 'Poivron jaune', herbs: ['salée', 'épicée'] },
  { type: 'ice', ingredient: 'Bâtonnet de Craparoi (Klawf Stick)', herbs: ['salée', 'salée'] },
  { type: 'fighting', ingredient: 'Cornichons', herbs: ['salée', 'salée'] },
  { type: 'poison', ingredient: 'Nouilles', herbs: ['salée', 'salée'] },
  { type: 'ground', ingredient: 'Jambon', herbs: ['salée', 'salée'] },
  { type: 'flying', ingredient: 'Jambon cru (prosciutto)', herbs: ['salée', 'salée'] },
  { type: 'psychic', ingredient: 'Oignon', herbs: ['salée', 'salée'] },
  { type: 'bug', ingredient: 'Tomates cerises', herbs: ['salée', 'salée'] },
  { type: 'rock', ingredient: 'Jalapeño', herbs: ['salée', 'salée'] },
  { type: 'ghost', ingredient: 'Oignon rouge', herbs: ['salée', 'salée'] },
  { type: 'dragon', ingredient: 'Avocat', herbs: ['salée', 'salée'] },
  { type: 'dark', ingredient: 'Filet fumé', herbs: ['salée', 'sucrée'] },
  { type: 'steel', ingredient: 'Hamburger', herbs: ['salée', 'sucrée'] },
  { type: 'fairy', ingredient: 'Tomate', herbs: ['salée', 'salée'] }
];

const DONUTS = [
  { name: '8 × Baie Hyper Tanga', note: 'La plus simple : maximise le Sucré.' },
  { name: '8 × Baie Hyper Haban', note: 'Alternative équivalente.' },
  { name: '4 × Hyper Tanga + 4 × Hyper Haban', note: 'Si tu manques de l\'une ou de l\'autre.' }
];

export default function RecipesTool() {
  const [tab, setTab] = useState('sv');
  const [q, setQ] = useState('');
  const query = normalize(q);
  const list = SANDWICHES.filter(r => !query || normalize(TYPE_BY_ID[r.type].name).includes(query) || normalize(r.ingredient).includes(query));

  return (
    <div className="space-y-4">
      <Segmented size="sm" value={tab} onChange={setTab} options={[{ id: 'sv', label: '🥪 Sandwichs ÉV' }, { id: 'za', label: '🍩 Donuts Z-A' }]} />

      {tab === 'sv' ? (
        <>
          <div className="card p-4 space-y-2 text-sm text-slate-300 leading-relaxed">
            <p><strong className="text-amber-300">Brillance Nv. 3 + Rencontre Nv. 3 + Titre Nv. 3</strong> pour le type choisi : 1 ingrédient + 2 Herba Mystica (obtenues dans les raids 5★ et 6★).</p>
            <p className="flex gap-1.5 text-xs text-slate-400"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Avant de valider, vérifie que l'écran affiche bien les trois pouvoirs au niveau 3. Combine avec 60 KO en apparition massive et le Charme Chroma pour 1/512.</p>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input type="search" className="input pl-11" value={q} onChange={e => setQ(e.target.value)} placeholder="Type ou ingrédient…" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {list.map(r => (
              <div key={r.type} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="w-24 shrink-0"><TypeBadge type={r.type} /></div>
                <div className="min-w-0 text-sm">
                  <div className="font-bold text-slate-100 truncate">{r.ingredient}</div>
                  <div className="text-xs text-slate-400">+ Herba Mystica {r.herbs[0]} + {r.herbs[1]}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Deux Herba Mystica sucrées ou deux acides ne fonctionnent pas pour certains types (Normal, Insecte, Dragon, Fée…). Les recettes varient selon les guides : celles-ci sont les plus courantes.</p>
        </>
      ) : (
        <>
          <div className="card p-4 space-y-2 text-sm text-slate-300 leading-relaxed">
            <p>Dans le DLC <strong className="text-amber-300">Mega Dimension</strong>, un donut avec <strong>Pouvoir Brillance</strong> ajoute 1 à 3 tirages shiny pour un type. Avec le Charme Chroma et Brillance Nv. 3 : environ <strong className="text-amber-300">1/586</strong>.</p>
            <p className="flex gap-1.5 text-xs text-slate-400"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Au Nv. 3, la quête d'Hyperespace « Attraper un shiny » garantit une apparition shiny du type du donut.</p>
          </div>
          <div className="card p-4 space-y-3">
            <div className="label-caps">Règles pour obtenir Brillance</div>
            <ul className="text-sm text-slate-300 space-y-1.5 list-disc pl-5">
              <li>Maximiser la saveur <strong>Sucrée</strong> (au moins 360, 420 ou plus conseillé, donut 5★).</li>
              <li>Garder <strong>Amer, Épicé et Acide</strong> sous 50 points chacun.</li>
              <li>La <strong>Fraîcheur</strong> est tolérée jusqu'à 180.</li>
              <li>Pas de recette garantie : le résultat reste aléatoire, recommence si besoin.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="label-caps">Recettes conseillées</div>
            {DONUTS.map(d => (
              <div key={d.name} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-sm font-bold text-slate-100">{d.name}</div>
                <div className="text-xs text-slate-400">{d.note}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Noms de baies d'après les guides anglophones. Les fossiles ne profitent ni du Charme ni des donuts.</p>
        </>
      )}
    </div>
  );
}
