// Listes perso (« À faire en Z-A », « Préférés »…) : { id, name, emoji, keys: { clé: true } }.
import { uid } from '../lib/id.js';

export const LIST_EMOJIS = ['📌', '⭐', '❤️', '🔥', '💎', '🎯', '🏆', '🌙', '🌊', '🌿', '⚡', '👻', '🐉', '🍇', '🗼', '🎮'];

export const createList = ({ name, emoji = '📌', keys = {} }, now = Date.now()) => ({
  id: uid(), name: String(name || '').trim().slice(0, 40) || 'Nouvelle liste', emoji, keys, updatedAt: now
});

/** Ajoute (on) ou retire des clés d'un ensemble { clé: true }. */
export function setKeys(map, keys, on) {
  const next = { ...map };
  for (const k of keys) { if (on) next[k] = true; else delete next[k]; }
  return next;
}

export const normalizeLists = arr => (Array.isArray(arr) ? arr.filter(l => l && l.id && l.name).map(l => ({
  id: String(l.id), name: String(l.name).slice(0, 40), emoji: l.emoji || '📌', keys: l.keys && typeof l.keys === 'object' ? l.keys : {}, updatedAt: l.updatedAt || Date.now()
})) : []);
