import raw from './pokedex.json';
import { REGIONAL_FORMS } from './forms.js';
import { SPRITES, STARTER_IDS, SHINY_LOCKED_IDS, regionForId, genForId } from './constants.js';
import { normalize } from '../lib/utils.js';

const build = (base, extra) => {
  const p = {
    ...base,
    isStarter: STARTER_IDS.has(base.baseId),
    isLegendary: !!extra.l,
    isMythical: !!extra.m,
    isBaby: !!extra.b,
    isShinyLocked: SHINY_LOCKED_IDS.has(base.baseId)
  };
  p.search = normalize(`${p.name} ${p.enName} ${p.baseId}`);
  return p;
};

const speciesById = new Map(raw.species.map(s => [s.id, s]));

const species = raw.species.map(s => build({
  key: String(s.id),
  id: s.id,
  baseId: s.id,
  pokeId: s.id,
  name: s.n,
  enName: s.e,
  types: s.t,
  region: regionForId(s.id),
  gen: genForId(s.id),
  isForm: false
}, s));

const formData = new Map(raw.forms.map(f => [f.id, f]));
const forms = REGIONAL_FORMS.map(f => {
  const data = formData.get(f.id) || {};
  const base = speciesById.get(f.baseId) || {};
  return build({
    key: f.id,
    id: f.baseId,
    baseId: f.baseId,
    pokeId: data.p || f.baseId,
    name: f.name,
    enName: `${base.e || ''} ${f.region}`,
    types: data.t || base.t || [],
    region: f.region,
    gen: genForId(f.baseId),
    isForm: true
  }, base);
});

// Les formes sont placées juste après leur espèce de base, comme dans un Pokédex.
export const POKEDEX = [...species, ...forms].sort((a, b) => a.id - b.id || (a.isForm - b.isForm) || a.key.localeCompare(b.key));
export const POKEMON_BY_KEY = new Map(POKEDEX.map(p => [p.key, p]));
export const getPokemon = key => POKEMON_BY_KEY.get(String(key));

export const spriteUrl = p => `${SPRITES}/pokemon/shiny/${p?.pokeId ?? 0}.png`;
export const normalSpriteUrl = p => `${SPRITES}/pokemon/${p?.pokeId ?? 0}.png`;
export const artworkUrl = (p, shiny = true) => `${SPRITES}/pokemon/other/official-artwork/${shiny ? 'shiny/' : ''}${p?.pokeId ?? 0}.png`;
