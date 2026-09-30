export const normalize = s => String(s || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, ' ')
  .toLowerCase()
  .trim();

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const padId = id => `#${String(id).padStart(4, '0')}`;

export const fmtNumber = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

export const fmtOdds = odds => `1/${Math.round(odds || 0)}`;

export const fmtRatio = r => (r > 0 && r < 0.01 ? '< 0,01×' : `${r.toFixed(2).replace('.', ',')}×`);

export const formatDuration = (ms, { short = false } = {}) => {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (short) {
    if (h >= 100) return `${h} h`;
    if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
    if (m > 0) return `${m} min`;
    return `${s} s`;
  }
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const isoFromTimestamp = ts => {
  const d = new Date(ts || Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDate = iso => {
  if (!iso) return 'Date inconnue';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const monthLabel = key => {
  const [y, m] = key.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// Probabilité d'avoir obtenu au moins un shiny après n tentatives à 1/odds.
export const cumulativeChance = (n, odds) => {
  if (!odds || odds <= 1) return n > 0 ? 1 : 0;
  return 1 - Math.pow(1 - 1 / odds, Math.max(0, n));
};

// Nombre de tentatives nécessaires pour atteindre une probabilité cible.
export const encountersFor = (target, odds) => {
  if (!odds || odds <= 1) return 1;
  return Math.ceil(Math.log(1 - target) / Math.log(1 - 1 / odds));
};

export const fmtPercent = (p, digits = 1) => {
  const v = p * 100;
  if (v > 0 && v < 0.1) return '< 0,1 %';
  if (v > 99.9 && v < 100) return '> 99,9 %';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: 0 })} %`;
};

export const getLuckTier = (count, odds) => {
  if (!count || count <= 0) return { id: 'none', name: 'Non renseigné', desc: 'Saisie manuelle sans compteur', emoji: '🎲', color: 'text-slate-400', bg: 'bg-slate-800/60 border-slate-700' };
  const ratio = count / (odds || 4096);
  if (ratio <= 0.25) return { id: 'king', name: 'Cocu Master', desc: 'Même pas eu le temps de lancer le café !', emoji: '👑', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/40' };
  if (ratio <= 0.75) return { id: 'lucky', name: 'Chatteux du Dimanche', desc: 'Franchement rapide et indécent !', emoji: '✨', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' };
  if (ratio <= 1.25) return { id: 'fair', name: 'Respectueux des Stats', desc: 'Pile dans les probabilités, comme dans un livre.', emoji: '⚖️', color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/40' };
  if (ratio <= 2.0) return { id: 'sweat', name: 'Début de Transpiration', desc: 'La patience commence à s\'effriter sévère…', emoji: '🫠', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/40' };
  if (ratio <= 3.0) return { id: 'suffer', name: 'Suffer Squad', desc: 'Plus du double des odds. Lâchez une larme.', emoji: '💀', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/40' };
  return { id: 'forgotten', name: 'Arceus t\'a Oublié', desc: 'Over Odds mythique, tu mérites une statue de seum.', emoji: '🗿', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/40' };
};

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

// Tri avec prise en compte des accents français
export const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
