import raw from './pokedex.json';
import { REGIONAL_FORMS } from './forms.js';
import { SPRITES, STARTER_IDS, SHINY_LOCKED_IDS, regionForId, genForId } from './constants.js';
import { GAMES, GAME_BY_ID, MEGA_GAMES, GMAX_GAMES } from './games.js';
import { normalize } from '../lib/utils.js';

const speciesById = new Map(raw.species.map(s => [s.id, s]));

const build = (base, extra) => {
  const p = {
    ...base,
    isStarter: STARTER_IDS.has(base.baseId),
    isLegendary: !!extra.l,
    isMythical: !!extra.m,
    isBaby: !!extra.b,
    canBreed: !extra.ne && !extra.l && !extra.m,
    isShinyLocked: SHINY_LOCKED_IDS.has(base.baseId)
  };
  p.search = normalize(`${p.name} ${p.enName} ${p.baseId}`);
  return p;
};

const species = raw.species.map(s => build({
  key: String(s.id), id: s.id, baseId: s.id, pokeId: s.id,
  name: s.n, enName: s.e, types: s.t,
  region: regionForId(s.id), gen: genForId(s.id),
  isForm: false, isVariant: false
}, s));

const formData = new Map(raw.forms.map(f => [f.id, f]));
const forms = REGIONAL_FORMS.map(f => {
  const data = formData.get(f.id) || {};
  const base = speciesById.get(f.baseId) || {};
  return build({
    key: f.id, id: f.baseId, baseId: f.baseId, pokeId: data.p || f.baseId,
    name: f.name, enName: `${base.e || ''} ${f.region}`, types: data.t || base.t || [],
    region: f.region, gen: genForId(f.baseId),
    isForm: true, isVariant: false
  }, base);
});

// Variantes : formes alternatives, Méga-Évolutions, Gigamax et différences mâle/femelle.
const VARIANT_LABELS = { mega: 'Méga', gmax: 'Gigamax', form: 'Forme', gender: 'Femelle' };
const variants = [
  ...(raw.variants || []).map(v => {
    const base = speciesById.get(v.b) || {};
    return build({
      key: v.k, id: v.b, baseId: v.b, pokeId: v.p || v.b, spritePath: v.s,
      name: v.n, enName: v.e.replace(/-/g, ' '), types: v.t.length ? v.t : base.t,
      region: regionForId(v.b), gen: genForId(v.b),
      isForm: false, isVariant: true, variantKind: v.c, hasArtwork: !!v.p
    }, base);
  }),
  ...raw.species.filter(s => s.g).map(s => build({
    key: `${s.id}-f`, id: s.id, baseId: s.id, pokeId: s.id, spritePath: `shiny/female/${s.id}.png`,
    name: `${s.n} ♀`, enName: `${s.e} female`, types: s.t,
    region: regionForId(s.id), gen: genForId(s.id),
    isForm: false, isVariant: true, variantKind: 'gender', hasArtwork: false
  }, s))
];
export { VARIANT_LABELS };

const order = p => (p.isVariant ? 2 : p.isForm ? 1 : 0);
export const POKEDEX = [...species, ...forms, ...variants].sort((a, b) => a.id - b.id || order(a) - order(b) || a.key.localeCompare(b.key));
export const MAIN_DEX = POKEDEX.filter(p => !p.isVariant);
export const POKEMON_BY_KEY = new Map(POKEDEX.map(p => [p.key, p]));
export const getPokemon = key => POKEMON_BY_KEY.get(String(key));

// Disponibilité par jeu d'après les Pokédex régionaux.
const DEX_SETS = Object.fromEntries(GAMES.map(g => [g.id, g.dexes
  ? new Set([...g.dexes.flatMap(d => raw.dexes?.[d] || []), ...(g.extra || [])])
  : null]));

export function isAvailableIn(p, gameId) {
  if (!gameId || gameId === 'all') return true;
  const game = GAME_BY_ID[gameId];
  if (!game) return true;
  const set = DEX_SETS[gameId];
  if (set && !set.has(p.baseId)) return false;
  if (p.isForm) return game.forms.includes(p.region);
  if (p.variantKind === 'mega') return MEGA_GAMES.includes(gameId);
  if (p.variantKind === 'gmax') return GMAX_GAMES.includes(gameId);
  return true;
}

export const gamesFor = p => GAMES.filter(g => g.dexes && isAvailableIn(p, g.id));

export const spriteUrl = p => (p?.spritePath ? `${SPRITES}/pokemon/${p.spritePath}` : `${SPRITES}/pokemon/shiny/${p?.pokeId ?? 0}.png`);
export const normalSpriteUrl = p => (p?.spritePath ? `${SPRITES}/pokemon/${p.spritePath.replace(/^shiny\//, '')}` : `${SPRITES}/pokemon/${p?.pokeId ?? 0}.png`);
export const animatedUrl = (p, shiny = true) => `${SPRITES}/pokemon/other/showdown/${shiny ? 'shiny/' : ''}${p?.pokeId ?? 0}.gif`;
export function artworkUrl(p, shiny = true) {
  if (p?.variantKind === 'gender') return `${SPRITES}/pokemon/other/home/${shiny ? 'shiny/' : ''}female/${p.baseId}.png`;
  if (p?.isVariant && !p.hasArtwork) return shiny ? spriteUrl(p) : normalSpriteUrl(p);
  return `${SPRITES}/pokemon/other/official-artwork/${shiny ? 'shiny/' : ''}${p?.pokeId ?? 0}.png`;
}
// Les sprites « pixel art » n'existent qu'en petite taille : on les agrandit sans lissage.
export const isPixelArtwork = p => !!(p?.isVariant && !p.hasArtwork && p.variantKind !== 'gender');
