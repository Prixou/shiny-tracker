// Conseil de chasse générique, affiché quand aucune option précise n'est connue pour un Pokémon.
export const getHuntingTip = p => {
  if (!p) return null;
  if (p.isShinyLocked) {
    return { game: 'Aucun', method: 'Shiny Lock', tip: 'Ce Pokémon est bloqué dans sa forme normale en jeu : seules des distributions officielles permettent de l\'obtenir chromatique.' };
  }
  if (p.region === 'hisui') {
    return { game: 'Légendes Pokémon : Arceus', method: 'Mégapparitions', tip: 'Complète la recherche Pokédex (Nv. 10 puis « parfait ») et obtiens le Charme Chroma pour atteindre environ 1/128 en Mégapparition.' };
  }
  if (p.isMythical) {
    return { game: 'Distribution / Pokémon GO', method: 'Évènement', tip: 'Les Fabuleux shiny s\'obtiennent surtout via distributions officielles, Pokémon HOME ou les études spéciales de Pokémon GO.' };
  }
  if (p.isLegendary) {
    if (p.gen <= 7) {
      return { game: 'Épée / Bouclier (Terres Dynamax)', method: 'Expéditions Dynamax', tip: 'Taux fixe de 1/100 avec le Charme Chroma (1/300 sans) pour les légendaires disponibles dans le Grand Antre.' };
    }
    return { game: 'Raids / Pokémon GO', method: 'Raids', tip: 'Surveille les raids évènementiels et les raids 5★ de Pokémon GO (environ 1/20).' };
  }
  if (p.isStarter) {
    return { game: 'Écarlate / Violet', method: 'Méthode Masuda', tip: 'Accouple le starter avec un Métamorph étranger (autre langue) : 1/512 avec le Charme Chroma.' };
  }
  if (p.id <= 151 && !p.isForm) {
    return { game: 'Let\'s Go ou Écarlate / Violet', method: 'Combo Capture ou Sandwich Brillance', tip: 'Dans Let\'s Go, enchaîne 31 captures avec un Parfum et le Charme Chroma. Dans ÉV, un sandwich Rencontre + Brillance Nv.3 du bon type fait des merveilles.' };
  }
  return { game: 'Écarlate / Violet', method: 'Apparition massive + Sandwich Nv.3', tip: 'Élimine 60 Pokémon de l\'apparition massive, puis mange un sandwich Brillance Nv.3 : environ 1/512 avec le Charme Chroma. À défaut, la méthode Masuda reste fiable.' };
};
