// Génère src/data/pokedex.json (Pokédex, Pokédex régionaux, variantes) et src/data/encounters.json
// (lieux de capture) à partir du miroir statique de PokéAPI (PokeAPI/api-data).
// Usage : npm run data   (derrière un proxy, Node >= 22.21 : NODE_USE_ENV_PROXY=1 npm run data)
import { writeFile, mkdir } from 'node:fs/promises';
import { REGIONAL_FORMS } from '../src/data/forms.js';
import { GAMES, ALL_DEX_NAMES } from '../src/data/games.js';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2';
const TYPES = ['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel',
  'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];

// Versions PokéAPI → identifiant de jeu de l'application
const VERSION_TO_GAME = {
  red: 'rbj', blue: 'rbj', yellow: 'rbj', gold: 'gsc', silver: 'gsc', crystal: 'gsc',
  ruby: 'rse', sapphire: 'rse', emerald: 'rse', firered: 'frlg', leafgreen: 'frlg',
  diamond: 'dpp', pearl: 'dpp', platinum: 'dpp', heartgold: 'hgss', soulsilver: 'hgss',
  black: 'bw', white: 'bw', 'black-2': 'b2w2', 'white-2': 'b2w2', x: 'xy', y: 'xy',
  'omega-ruby': 'oras', 'alpha-sapphire': 'oras', sun: 'sm', moon: 'sm', 'ultra-sun': 'usum', 'ultra-moon': 'usum',
  'lets-go-pikachu': 'letsgo', 'lets-go-eevee': 'letsgo', sword: 'swsh', shield: 'swsh',
  'brilliant-diamond': 'bdsp', 'shining-pearl': 'bdsp', 'legends-arceus': 'pla', scarlet: 'sv', violet: 'sv'
};

// Formes jamais disponibles en shiny ou sans intérêt pour une collection.
const EXCLUDED_FORM = /-(totem|starter|cap|rock-star|belle|pop-star|phd|libre|cosplay|eternamax)(-|$)/;

async function getJson(path, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${BASE}${path}index.json`);
      if (res.ok) return res.json();
      if (res.status === 404) return null;
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await new Promise(r => setTimeout(r, 500 * 2 ** i));
  }
  throw new Error(`Échec : ${path}`);
}

async function pool(items, size, fn, label) {
  const out = new Array(items.length);
  let next = 0;
  let done = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
      if (label && ++done % 250 === 0) console.log(`  ${label} ${done}/${items.length}`);
    }
  }));
  return out;
}

const idFromUrl = url => Number(url.split('/').filter(Boolean).pop());
const apiPath = url => url.replace(/^.*\/api\/v2/, '');
const fr = (names, fallback) => names?.find(n => n.language.name === 'fr')?.name || fallback;

console.log('Types…');
const typeByPokemon = {};
for (let n = 1; n <= TYPES.length; n++) {
  const t = await getJson(`/type/${n}/`);
  if (!TYPES.includes(t.name)) throw new Error(`Type inattendu : ${t.name}`);
  for (const { slot, pokemon } of t.pokemon) {
    (typeByPokemon[pokemon.name] ||= [])[slot - 1] = t.name;
  }
}

console.log('Index…');
const index = await getJson('/pokemon/');
const pokemonIdByName = Object.fromEntries(index.results.map(r => [r.name, idFromUrl(r.url)]));
const speciesIndex = await getJson('/pokemon-species/');
const MAX_ID = speciesIndex.count;

console.log(`Espèces (${MAX_ID})…`);
const speciesRaw = await pool(Array.from({ length: MAX_ID }, (_, i) => i + 1), 24, id => getJson(`/pokemon-species/${id}/`), 'espèces');
const species = speciesRaw.map((s, i) => {
  const id = i + 1;
  const name = lang => s.names.find(n => n.language.name === lang)?.name;
  const defaultVariety = s.varieties.find(v => v.is_default)?.pokemon.name;
  const entry = { id, n: name('fr') || name('en'), e: name('en') || s.name, t: (typeByPokemon[defaultVariety] || []).filter(Boolean) };
  if (s.is_legendary) entry.l = 1;
  if (s.is_mythical) entry.m = 1;
  if (s.is_baby) entry.b = 1;
  if (s.has_gender_differences) entry.g = 1;
  return entry;
});
const speciesIdByName = Object.fromEntries(speciesRaw.map((s, i) => [s.name, i + 1]));

console.log('Formes régionales…');
const regionalNames = new Set(REGIONAL_FORMS.map(f => f.apiName));
const forms = REGIONAL_FORMS.map(f => {
  const pokeId = pokemonIdByName[f.apiName];
  if (!pokeId) throw new Error(`Forme introuvable : ${f.apiName}`);
  return { id: f.id, p: pokeId, t: (typeByPokemon[f.apiName] || []).filter(Boolean) };
});

console.log('Variantes (formes alternatives, Méga, Gigamax)…');
const formIndex = await getJson('/pokemon-form/');
const formsRaw = await pool(formIndex.results.map(r => idFromUrl(r.url)), 24, id => getJson(`/pokemon-form/${id}/`), 'formes');
const pokemonCache = new Map();
const variants = [];
for (const f of formsRaw) {
  if (!f) continue;
  const pokemonName = f.pokemon.name;
  const pokemonId = idFromUrl(f.pokemon.url);
  if (regionalNames.has(f.name) || regionalNames.has(pokemonName)) continue;
  if (EXCLUDED_FORM.test(f.name)) continue;
  const isGmax = f.name.includes('-gmax');
  if (f.is_battle_only && !f.is_mega && !isGmax) continue;
  // Forme par défaut d'une espèce : déjà dans le Pokédex principal.
  if (f.is_default && pokemonId <= MAX_ID) continue;
  if (!pokemonCache.has(pokemonId)) pokemonCache.set(pokemonId, await getJson(`/pokemon/${pokemonId}/`));
  const pokemon = pokemonCache.get(pokemonId);
  // Les variétés (Méga, Gigamax, Motisma…) ont leur sprite sur le Pokémon, pas sur la forme.
  const sprite = f.sprites?.front_shiny || (f.is_default ? pokemon?.sprites?.front_shiny : null);
  if (!sprite) continue;
  const spId = speciesIdByName[pokemon?.species.name];
  if (!spId) continue;
  const baseFr = species[spId - 1].n;
  const formFr = fr(f.form_names);
  const name = fr(f.names) || (formFr ? `${baseFr} (${formFr})` : `${baseFr} (${f.form_name || f.name})`);
  const types = f.types?.length ? [...f.types].sort((a, b) => a.slot - b.slot).map(t => t.type.name) : (typeByPokemon[pokemonName] || species[spId - 1].t);
  variants.push({
    k: `v-${f.name}`,
    b: spId,
    n: name,
    e: f.name,
    t: types.filter(Boolean),
    s: sprite.split('/sprites/pokemon/')[1],
    p: pokemonId > MAX_ID ? pokemonId : 0,
    c: f.is_mega ? 'mega' : isGmax ? 'gmax' : 'form'
  });
}
variants.sort((a, b) => a.b - b.b || a.k.localeCompare(b.k));
// Certaines formes n'existent qu'en interne (ex. Zygarde « Rassemblement ») : un seul exemplaire par nom affiché.
const seenNames = new Set();
for (let i = variants.length - 1; i >= 0; i--) {
  if (seenNames.has(variants[i].n)) variants.splice(i, 1); else seenNames.add(variants[i].n);
}

console.log('Pokédex régionaux…');
const dexIndex = await getJson('/pokedex/');
const dexes = {};
for (const r of dexIndex.results) {
  if (!ALL_DEX_NAMES.includes(r.name)) continue;
  const d = await getJson(`/pokedex/${idFromUrl(r.url)}/`);
  dexes[r.name] = [...new Set(d.pokemon_entries.map(e => idFromUrl(e.pokemon_species.url)))].sort((a, b) => a - b);
}
const missing = ALL_DEX_NAMES.filter(n => !dexes[n]);
if (missing.length) throw new Error(`Pokédex manquants : ${missing.join(', ')}`);

console.log('Lieux de capture…');
const GAME_IDS = GAMES.map(g => g.id);
const METHODS = [];
const LOCS = [];
const indexer = list => name => { let i = list.indexOf(name); if (i < 0) { i = list.length; list.push(name); } return i; };
const methodIdx = indexer(METHODS);
const locIdx = indexer(LOCS);

const encRaw = await pool(Array.from({ length: MAX_ID }, (_, i) => i + 1), 24, id => getJson(`/pokemon/${id}/encounters/`), 'rencontres');
const areaUrls = [...new Set(encRaw.flat().filter(Boolean).map(e => e.location_area.url))];
const areaData = await pool(areaUrls, 24, url => getJson(apiPath(url)), 'zones');
const locationUrls = [...new Set(areaData.filter(Boolean).map(a => a.location.url))];
const locationData = await pool(locationUrls, 24, url => getJson(apiPath(url)), 'lieux');
const locationName = new Map(locationUrls.map((u, i) => {
  const l = locationData[i];
  return [u, fr(l?.names, l?.names?.find(n => n.language.name === 'en')?.name || l?.name)];
}));
const areaToLoc = new Map(areaUrls.map((u, i) => {
  const a = areaData[i];
  if (!a) return [u, null];
  const base = locationName.get(a.location.url) || a.name;
  const sub = fr(a.names);
  return [u, locIdx(sub && sub !== base && !sub.startsWith(base) ? `${base} · ${sub}` : sub || base)];
}));

const encounters = {};
encRaw.forEach((list, i) => {
  if (!list?.length) return;
  const rows = new Map();
  for (const e of list) {
    const loc = areaToLoc.get(e.location_area.url);
    if (loc == null) continue;
    for (const vd of e.version_details) {
      const game = VERSION_TO_GAME[vd.version.name];
      if (!game) continue;
      for (const d of vd.encounter_details) {
        const key = `${game}|${loc}|${d.method.name}`;
        const row = rows.get(key) || [GAME_IDS.indexOf(game), loc, methodIdx(d.method.name), d.min_level, d.max_level, 0];
        row[3] = Math.min(row[3], d.min_level);
        row[4] = Math.max(row[4], d.max_level);
        row[5] = Math.max(row[5], vd.max_chance);
        rows.set(key, row);
      }
    }
  }
  if (rows.size) encounters[i + 1] = [...rows.values()];
});

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/pokedex.json', import.meta.url), JSON.stringify({ species, forms, variants, dexes }));
await writeFile(new URL('../src/data/encounters.json', import.meta.url), JSON.stringify({ games: GAME_IDS, methods: METHODS, locations: LOCS, encounters }));
console.log(`OK : ${species.length} espèces, ${forms.length} formes régionales, ${variants.length} variantes, ${Object.keys(dexes).length} Pokédex, ${Object.keys(encounters).length} espèces avec lieux.`);
