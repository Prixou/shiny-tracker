import { useState } from 'react';
import { Search } from 'lucide-react';
import { normalize } from '../../lib/text.js';
import { Segmented } from '../../ui/index.js';
import SparklingTab from './recipes/SparklingTab.jsx';
import NoSpiceTab from './recipes/NoSpiceTab.jsx';
import DonutsTab from './recipes/DonutsTab.jsx';

/** Recettes : sandwichs d'Écarlate / Violet (avec ou sans Épice Secrète) et donuts de Z-A. */
export default function RecipesTool() {
  const [tab, setTab] = useState('sparkling');
  const [q, setQ] = useState('');
  const query = normalize(q);
  return (
    <div className="space-y-4">
      <Segmented size="sm" value={tab} onChange={setTab}
        options={[{ id: 'sparkling', label: '✨ Brillance' }, { id: 'nospice', label: '🥪 Sans épice' }, { id: 'donuts', label: '🍩 Z-A' }]} />
      {tab !== 'donuts' && (
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input type="search" className="input pl-11" value={q} onChange={e => setQ(e.target.value)} placeholder="Type ou ingrédient…" aria-label="Chercher une recette" />
        </div>
      )}
      {tab === 'sparkling' && <SparklingTab query={query} />}
      {tab === 'nospice' && <NoSpiceTab query={query} />}
      {tab === 'donuts' && <DonutsTab />}
    </div>
  );
}
