// Génère src/data/pokedex.json à partir du miroir statique de PokéAPI (PokeAPI/api-data).
// Usage : npm run data   (sur Node >= 22.21 derrière un proxy : NODE_USE_ENV_PROXY=1 npm run data)
import { writeFile, mkdir } from 'node:fs/promises';
import { REGIONAL_FORMS } from '../src/data/forms.js';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2';
const MAX_ID = 1025;
const TYPES = ['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel',
  'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];

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

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

const idFromUrl = url => Number(url.split('/').filter(Boolean).pop());

console.log('Types…');
const typeByPokemon = {};
for (let n = 1; n <= TYPES.length; n++) {
  const t = await getJson(`/type/${n}/`);
  if (!TYPES.includes(t.name)) throw new Error(`Type inattendu : ${t.name}`);
  for (const { slot, pokemon } of t.pokemon) {
    (typeByPokemon[pokemon.name] ||= [])[slot - 1] = t.name;
  }
}

console.log('Index des Pokémon…');
const index = await getJson('/pokemon/');
const pokemonIdByName = Object.fromEntries(index.results.map(r => [r.name, idFromUrl(r.url)]));
const nameById = Object.fromEntries(index.results.map(r => [idFromUrl(r.url), r.name]));

console.log('Espèces (1025)…');
let done = 0;
const species = await pool(Array.from({ length: MAX_ID }, (_, i) => i + 1), 24, async id => {
  const s = await getJson(`/pokemon-species/${id}/`);
  if (++done % 100 === 0) console.log(`  ${done}/${MAX_ID}`);
  const name = lang => s.names.find(n => n.language.name === lang)?.name;
  const defaultVariety = s.varieties.find(v => v.is_default)?.pokemon.name || nameById[id];
  const entry = {
    id,
    n: name('fr') || name('en'),
    e: name('en') || s.name,
    t: (typeByPokemon[defaultVariety] || []).filter(Boolean)
  };
  if (s.is_legendary) entry.l = 1;
  if (s.is_mythical) entry.m = 1;
  if (s.is_baby) entry.b = 1;
  return entry;
});

console.log('Formes régionales…');
const forms = REGIONAL_FORMS.map(f => {
  const pokeId = pokemonIdByName[f.apiName];
  if (!pokeId) throw new Error(`Forme introuvable : ${f.apiName}`);
  const types = (typeByPokemon[f.apiName] || []).filter(Boolean);
  return { id: f.id, p: pokeId, t: types };
});

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/pokedex.json', import.meta.url), JSON.stringify({ species, forms }));
console.log(`OK : ${species.length} espèces, ${forms.length} formes.`);
