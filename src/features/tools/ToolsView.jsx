import { useEffect, useRef, useState } from 'react';
import { useActions, useStoreApi } from '../../state/StoreProvider.jsx';
import RandomTool from './RandomTool.jsx';
import OddsTool from './OddsTool.jsx';
import RecipesTool from './RecipesTool.jsx';
import AgendaTool from './AgendaTool.jsx';
import DataTool from '../backup/DataTool.jsx';
import SettingsTool from '../settings/SettingsTool.jsx';

const SECTIONS = [
  { id: 'random', label: 'Tirage' },
  { id: 'odds', label: 'Probas' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'recipes', label: 'Recettes' },
  { id: 'data', label: 'Données' },
  { id: 'settings', label: 'Réglages' }
];

export default function ToolsView() {
  const store = useStoreApi();
  const { setUiValue } = useActions();
  const [section, setSection] = useState(() => {
    const saved = store.getState().ui.toolsSection;
    return SECTIONS.some(s => s.id === saved) ? saved : 'random';
  });
  const change = id => { setSection(id); setUiValue('toolsSection', id); };
  const rowRef = useRef(null);
  // Garde l'onglet actif visible dans la rangée défilante.
  useEffect(() => {
    rowRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [section]);
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div ref={rowRef} role="tablist" className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {SECTIONS.map(s => (
          <button key={s.id} role="tab" aria-selected={section === s.id} onClick={() => change(s.id)}
            className={`chip shrink-0 ${section === s.id ? 'chip-on' : 'chip-off'}`}>
            {s.label}
          </button>
        ))}
      </div>
      {section === 'random' && <RandomTool />}
      {section === 'odds' && <OddsTool />}
      {section === 'agenda' && <AgendaTool />}
      {section === 'recipes' && <RecipesTool />}
      {section === 'data' && <DataTool />}
      {section === 'settings' && <SettingsTool />}
    </div>
  );
}
