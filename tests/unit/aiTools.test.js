import { describe, it, expect } from 'vitest';
import { runTool, buildContext, TOOL_DEFS, findPokemon } from '../../src/services/ai/tools.js';

const NOW = Date.now();
const store = (patch = {}) => ({
  shinies: { 25: { key: '25' } },
  catchesByKey: { 25: [{}, {}] },
  wishlist: { 448: true },
  catches: [{ id: 'c1', key: '25', date: '2026-10-01', game: 'sv', method: 'masuda', count: 300, odds: 512, ball: 'pokeball', timestamp: NOW }],
  hunts: [{ id: 'h1', targetId: '506', game: 'bw', method: 'wild', opts: {}, charm: false, count: 40, step: 1, phases: [], elapsedMs: 60000, startedAt: NOW - 1000, status: 'active', updatedAt: NOW }],
  lists: [{ id: 'l1', name: 'À faire en ROSA', emoji: '🌋', keys: {} }],
  settings: { defaultGame: 'sv', charm: true, myGames: [], charmGames: {} },
  ...patch
});
const call = async (name, args, s = store()) => {
  const actions = [];
  const out = await runTool(name, args, { s, onAction: a => actions.push(a) });
  return { out, actions };
};

describe('outils de l\'assistant', () => {
  it('toutes les définitions ont un schéma objet', () => {
    for (const t of TOOL_DEFS) {
      expect(t.schema.type).toBe('object');
      expect(t.description.length).toBeGreaterThan(20);
    }
  });

  it('retrouvent un Pokémon par nom FR/EN, numéro ou forme', () => {
    expect(findPokemon('pikachu')[0].key).toBe('25');
    expect(findPokemon('Lillipup')[0].key).toBe('506');
    expect(findPokemon('#448')[0].key).toBe('448');
    expect(findPokemon('goupix d\'alola', { all: true })[0].key).toBe('37-alola');
  });

  it('chercher_pokemon indique la collection', async () => {
    const { out } = await call('chercher_pokemon', { nom: 'Pikachu' });
    expect(out.resultats[0]).toMatchObject({ cle: '25', shiny_capture: true, exemplaires: 2 });
  });

  it('meilleures_options limite aux jeux possédés et indique le transfert HOME', async () => {
    const s = store({ settings: { charm: true, myGames: ['xy', 'sv'], charmGames: {} } });
    const { out } = await call('meilleures_options', { pokemon: 'Évoli' }, s);
    expect(out.options.every(o => ['xy', 'sv'].includes(o.jeu_id))).toBe(true);
    expect(out.options_dans_des_jeux_non_possedes.length).toBeGreaterThan(0);
    expect(out.options.find(o => o.jeu_id === 'xy').transfert_home).toMatch(/Banque/);
    expect(out.options.find(o => o.jeu_id === 'sv').transfert_home).toBe('oui');
  });

  it('pokemon_manquants filtre par région', async () => {
    const { out } = await call('pokemon_manquants', { region: 'kanto', limite: 5 });
    expect(out.affiches).toBe(5);
    expect(out.pokemon.every(p => p.region === 'Kanto')).toBe(true);
    expect(out.pokemon.some(p => p.cle === '25')).toBe(false);
  });

  it('proposer_chasse affiche une carte, ou refuse un jeu impossible', async () => {
    const ok = await call('proposer_chasse', { pokemon: 'Ponchiot', jeu: 'xy' });
    expect(ok.actions[0]).toMatchObject({ type: 'hunt', key: '506' });
    expect(ok.actions[0].cfg.game).toBe('xy');
    await expect(call('proposer_chasse', { pokemon: 'Ponchiot', jeu: 'oras' })).rejects.toThrow(/pas disponible/);
    await expect(call('proposer_chasse', { pokemon: 'Zacian', jeu: 'swsh' })).rejects.toThrow(/Shiny Lock/);
  });

  it('proposer_action prépare une modification sans l\'appliquer', async () => {
    const { out, actions } = await call('proposer_action', { action: 'ajouter_objectifs', pokemon: ['Ponchiot', 'lucario', '448'] });
    expect(out.en_attente).toBe(true);
    expect(actions[0]).toMatchObject({ type: 'change', kind: 'ajouter_objectifs', keys: ['506', '448'] });
    const list = await call('proposer_action', { action: 'ajouter_a_liste', pokemon: ['Ponchiot'], liste: 'rosa' });
    expect(list.actions[0]).toMatchObject({ kind: 'ajouter_a_liste', listId: 'l1' });
    await expect(call('proposer_action', { action: 'ajouter_a_liste', pokemon: ['Ponchiot'], liste: 'inconnue' })).rejects.toThrow(/Liste introuvable/);
    const pause = await call('proposer_action', { action: 'pause_chasse', pokemon: ['Ponchiot'] });
    expect(pause.actions[0]).toMatchObject({ kind: 'pause_chasse', huntId: 'h1' });
  });

  it('priorites_banque renvoie les deux catégories', async () => {
    const { out } = await call('priorites_banque', { limite: 3 });
    expect(out.jours_restants).toBeGreaterThanOrEqual(0);
    expect(out.seulement_ds_3ds.pokemon.length).toBeLessThanOrEqual(3);
    expect(out.seulement_ds_3ds.total).toBeGreaterThan(0);
  });

  it('valident les arguments', async () => {
    await expect(call('infos_jeu', { jeu: 'pokemon-z' })).rejects.toThrow(/Jeu inconnu/);
    await expect(call('pokemon_manquants', { limite: 'beaucoup' })).rejects.toThrow(/integer/);
    await expect(call('proposer_action', { action: 'tout_supprimer' })).rejects.toThrow(/valeur parmi/);
    await expect(call('meilleures_options', {})).rejects.toThrow(/manquant/);
    await expect(call('outil_inconnu', {})).rejects.toThrow(/inconnu/);
  });

  it('le contexte de départ résume la collection et les règles', () => {
    const ctx = buildContext(store({ settings: { charm: false, myGames: ['xy'], charmGames: { xy: true }, defaultGame: 'sv' } }), 'Pas de Pokémon GO.', { webSearch: true });
    expect(ctx).toMatch(/Jeux possédés : XY \(avec Charme Chroma\)/);
    expect(ctx).toMatch(/25 février 2027/);
    expect(ctx).toMatch(/recherche web/);
    expect(ctx).toMatch(/Pas de Pokémon GO\./);
    expect(buildContext(store(), '')).toMatch(/pas accès au web/);
  });
});
