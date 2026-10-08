// Modifications proposées par l'assistant : une carte « Appliquer » s'affiche, l'utilisateur décide.
/** @import { Tool } from './types.js' */
import { normalize } from '../../../lib/text.js';
import { resolveOne } from './lookup.js';

const ACTIONS = ['ajouter_objectifs', 'retirer_objectifs', 'creer_liste', 'ajouter_a_liste', 'retirer_de_liste', 'pause_chasse'];

/** @type {Tool} */
export const proposerAction = {
  name: 'proposer_action',
  description: 'Propose une modification des données de l\'utilisateur. Une carte « Appliquer » s\'affiche : rien n\'est fait tant qu\'il n\'a pas appuyé dessus, donc ne dis jamais que c\'est fait. Actions : ajouter_objectifs, retirer_objectifs, creer_liste (avec nom et Pokémon), ajouter_a_liste, retirer_de_liste, pause_chasse (arrête le chronomètre de la chasse d\'un Pokémon).',
  schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ACTIONS, description: 'Type de modification' },
      pokemon: { type: 'array', items: { type: 'string' }, description: 'Clés internes ou noms des Pokémon concernés (30 au plus)' },
      liste: { type: 'string', description: 'Nom de la liste (creer_liste, ajouter_a_liste, retirer_de_liste)' },
      emoji: { type: 'string', description: 'Emoji de la nouvelle liste (facultatif)' },
      resume: { type: 'string', description: 'Une phrase courte affichée sur la carte' }
    },
    required: ['action']
  },
  async run(args, { s, onAction }) {
    const keys = [...new Set((args.pokemon || []).slice(0, 30).map(q => resolveOne(String(q)).key))];
    const listName = (args.liste || '').trim();
    const findList = () => {
      const n = normalize(listName);
      const list = s.lists.find(l => normalize(l.name) === n) || s.lists.find(l => normalize(l.name).includes(n));
      if (!list) throw new Error(`Liste introuvable : « ${listName} ». Listes existantes : ${s.lists.map(l => l.name).join(', ') || 'aucune'}.`);
      return list;
    };
    const needKeys = () => { if (!keys.length) throw new Error('Indique au moins un Pokémon dans « pokemon ».'); };
    let action;
    switch (args.action) {
      case 'ajouter_objectifs':
      case 'retirer_objectifs': {
        needKeys();
        action = { kind: args.action, keys };
        break;
      }
      case 'creer_liste': {
        if (!listName) throw new Error('Indique le nom de la liste dans « liste ».');
        action = { kind: 'creer_liste', keys, name: listName.slice(0, 40), emoji: (args.emoji || '📌').slice(0, 4) };
        break;
      }
      case 'ajouter_a_liste':
      case 'retirer_de_liste': {
        needKeys();
        const list = findList();
        action = { kind: args.action, keys, listId: list.id, name: list.name, emoji: list.emoji };
        break;
      }
      case 'pause_chasse': {
        needKeys();
        const hunt = s.hunts.find(h => h.status === 'active' && h.targetId === keys[0]);
        if (!hunt) throw new Error('Aucune chasse en cours pour ce Pokémon.');
        if (!hunt.startedAt) return { deja_en_pause: true, message: 'Le chronomètre de cette chasse est déjà arrêté.' };
        action = { kind: 'pause_chasse', keys: [hunt.targetId], huntId: hunt.id };
        break;
      }
      default:
        throw new Error('Action inconnue.');
    }
    onAction({ type: 'change', ...action, label: args.resume || null });
    return { en_attente: true, message: 'Carte affichée. L\'utilisateur doit appuyer sur « Appliquer » : ne dis pas que c\'est déjà fait.' };
  }
};
