import { createContext, useContext } from 'react';

// Actions de navigation globales : ouvrir la fiche d'un Pokémon, lancer une chasse, changer d'onglet.
export const NavContext = createContext({
  tab: 'dex',
  goTo: () => {},
  openPokemon: () => {},
  openNewHunt: () => {}
});

export const useNav = () => useContext(NavContext);
