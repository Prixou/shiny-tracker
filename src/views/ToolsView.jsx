import { useState } from 'react';
import { Dices, Calculator, HardDrive, Settings } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { Segmented } from '../components/ui.jsx';
import RandomTool from '../tools/RandomTool.jsx';
import OddsTool from '../tools/OddsTool.jsx';
import DataTool from '../tools/DataTool.jsx';
import SettingsTool from '../tools/SettingsTool.jsx';

const SECTIONS = [
  { id: 'random', label: 'Tirage', icon: <Dices className="w-4 h-4" /> },
  { id: 'odds', label: 'Probas', icon: <Calculator className="w-4 h-4" /> },
  { id: 'data', label: 'Données', icon: <HardDrive className="w-4 h-4" /> },
  { id: 'settings', label: 'Réglages', icon: <Settings className="w-4 h-4" /> }
];

export default function ToolsView() {
  const { ui, setUiValue } = useStore();
  const [section, setSection] = useState(SECTIONS.some(s => s.id === ui.toolsSection) ? ui.toolsSection : 'random');
  const change = id => { setSection(id); setUiValue('toolsSection', id); };
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Segmented options={SECTIONS} value={section} onChange={change} size="sm" />
      {section === 'random' && <RandomTool />}
      {section === 'odds' && <OddsTool />}
      {section === 'data' && <DataTool />}
      {section === 'settings' && <SettingsTool />}
    </div>
  );
}
