// Onglets de la barre de navigation.
import { Layers, Timer, BookOpen, BarChart3, Wrench } from 'lucide-react';

export const NAV = [
  { id: 'dex', label: 'Pokédex', icon: Layers },
  { id: 'hunts', label: 'Chasses', icon: Timer },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'tools', label: 'Outils', icon: Wrench }
];
export const TABS = NAV.map(n => n.id);

/** Onglet d'ouverture : `?tab=` (raccourcis de l'app installée), sinon le dernier utilisé. */
export function initialTab(ui, search = window.location.search) {
  const fromUrl = new URLSearchParams(search).get('tab');
  if (TABS.includes(fromUrl)) return fromUrl;
  return TABS.includes(ui.tab) ? ui.tab : 'dex';
}
