// Formes des données de l'application, décrites en JSDoc.
// L'éditeur s'en sert pour l'autocomplétion et `npm run typecheck` (TypeScript) les vérifie.
// Utilisation dans un fichier : /** @import { Catch, Hunt } from './types.js' */

/**
 * Réglages de taux d'une chasse ou d'une option de chasse.
 * @typedef {object} OddsConfig
 * @property {string} game Identifiant de jeu (data/games.js).
 * @property {string} method Identifiant de méthode (data/methods.js).
 * @property {Record<string, number | boolean>} [opts] Options de la méthode (sandwich, apparition massive…).
 * @property {boolean} [charm] Charme Chroma.
 * @property {number | null} [customOdds] Taux saisi à la main (1/x), prioritaire sur le calcul.
 */

/**
 * Exemplaire shiny capturé.
 * @typedef {object} Catch
 * @property {string} id
 * @property {string} key Clé du Pokémon (« 25 », « 37-alola », « 6-mega-x »…).
 * @property {string} date Date locale « AAAA-MM-JJ » ('' si inconnue).
 * @property {number} timestamp
 * @property {string} method
 * @property {Record<string, number | boolean>} opts
 * @property {string} ball Identifiant de Poké Ball (data/constants.js).
 * @property {string} game Identifiant de jeu ('' si non précisé).
 * @property {number} count Rencontres.
 * @property {number} elapsedMs
 * @property {number} odds Taux au moment de la capture (1/x).
 * @property {number | null} luck Ratio de chance (null : déduit de count / odds).
 * @property {number} phases Nombre de phases de la chasse.
 * @property {string} nickname
 * @property {'' | 'm' | 'f'} gender
 * @property {string} notes
 * @property {string | null} huntId Chasse d'origine.
 * @property {number} updatedAt
 * @property {string} [nature]
 * @property {string} [ability]
 * @property {number | ''} [level]
 * @property {boolean} [alpha] Baron (Légendes Arceus, Z-A).
 * @property {string} [mark]
 * @property {string} [teraType]
 * @property {string} [language]
 * @property {boolean} [inHome] Transféré dans Pokémon HOME.
 * @property {boolean} [provisional] Exemplaire provisoire (distribution), à remplacer par un shiny chassé soi-même.
 * @property {boolean} [verified] Détails confirmés (édition en lot ou fiche) : n'est plus « à vérifier ».
 */

/**
 * Phase terminée d'une chasse (autre shiny apparu ou chaîne rompue).
 * @typedef {object} Phase
 * @property {number} count Compteur au moment de la phase.
 * @property {number} at
 * @property {string} key Pokémon apparu ('' si non précisé).
 * @property {string} note
 */

/**
 * Chasse en cours ou terminée.
 * @typedef {object} Hunt
 * @property {string} id
 * @property {string} targetId Clé du Pokémon ciblé.
 * @property {string} game
 * @property {string} method
 * @property {Record<string, number | boolean>} opts
 * @property {boolean} charm
 * @property {number | null} customOdds
 * @property {number} count Compteur de la phase en cours.
 * @property {number} step Valeur ajoutée à chaque appui.
 * @property {Phase[]} phases
 * @property {number} elapsedMs Temps cumulé hors chrono en cours.
 * @property {number | null} startedAt Début du chrono en cours (null : en pause).
 * @property {'active' | 'done'} status
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {number | null} finishedAt
 * @property {string} notes
 */

/**
 * Liste perso de Pokémon.
 * @typedef {object} PokemonList
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {Record<string, boolean>} keys Clés des Pokémon de la liste.
 * @property {number} updatedAt
 */

/** @typedef {Record<string, boolean>} Wishlist Objectifs : { clé du Pokémon: true }. */

/**
 * Données synchronisées et sauvegardées.
 * @typedef {object} AppData
 * @property {Catch[]} catches
 * @property {Hunt[]} hunts
 * @property {Wishlist} wishlist
 * @property {PokemonList[]} lists
 */

/**
 * Instantané de l'état, pour les traitements hors React (assistant, export) : voir selectSnapshot.
 * @typedef {AppData & {
 *   settings: import('./settings.js').Settings,
 *   ui: Record<string, any>,
 *   shinies: Record<string, Catch>,
 *   catchesByKey: Record<string, Catch[]>
 * }} Snapshot
 */

/**
 * Façon d'obtenir un shiny (écran « Meilleures options », assistant, plan Banque).
 * @typedef {object} BestOption
 * @property {string} game
 * @property {OddsConfig} cfg Réglages prêts pour une nouvelle chasse.
 * @property {number} odds Meilleur taux atteignable (1/x).
 * @property {string} label
 * @property {string[]} locations
 * @property {string | null} [estimate]
 * @property {string | null} [note]
 */

/**
 * Données de lieux de capture (src/data/encounters.json, chargées à la demande).
 * Les chaînes sont dédupliquées : les rencontres pointent vers leurs index.
 * @typedef {object} EncounterData
 * @property {string[]} games Identifiants de jeu.
 * @property {string[]} methods Modes de rencontre PokéAPI (« walk », « old-rod »…).
 * @property {string[]} locations
 * @property {Record<string, Array<[number, number, number, number, number, number]>>} encounters
 *   Par espèce : [jeu, lieu, mode, niveau min, niveau max, chance %].
 * @property {number[]} [svEventOutbreaks] Espèces déjà vues en apparition massive évènementielle (ÉV).
 * @property {boolean} [error] Chargement impossible.
 */

/**
 * Entrée de la pile d'annulation : état « avant » des seuls éléments touchés.
 * @typedef {object} UndoEntry
 * @property {string} id
 * @property {string} label Texte du toast « Annuler ».
 * @property {Record<string, any>} before
 * @property {number} at
 */

export {};
