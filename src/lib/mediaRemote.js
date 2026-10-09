// Télécommande multimédia (Media Session) : les boutons d'écouteurs Bluetooth et le lecteur de l'écran
// verrouillé pilotent l'app, téléphone en poche. Android n'affiche ces commandes que pendant une lecture
// audio de plus de 5 secondes : on joue en boucle un silence généré à la volée (aucun fichier à télécharger).
// La lecture garde aussi la page active en arrière-plan.

/**
 * État de la télécommande. `target` : ce qu'elle pilote (ex. : identifiant de chasse) ; `interrupted` :
 * coupée par le système (appel, autre lecture audio).
 * @typedef {{ active: boolean, target: string | null, interrupted: boolean }} RemoteState
 */

/** @type {RemoteState} */
let state = { active: false, target: null, interrupted: false };
/** @type {Set<() => void>} */
const listeners = new Set();
/** @type {HTMLAudioElement | null} */
let audio = null;
let stopping = false;

/**
 * Fichier WAV de silence (8 kHz, 8 bits, mono).
 * @param {number} [seconds]
 * @returns {Uint8Array<ArrayBuffer>}
 */
export function silentWav(seconds = 10) {
  const rate = 8000;
  const size = Math.round(seconds * rate);
  const bytes = new Uint8Array(44 + size);
  const view = new DataView(bytes.buffer);
  const text = (offset, s) => [...s].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + size, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true); // taille du bloc « fmt »
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true); // octets par seconde
  view.setUint16(32, 1, true); // octets par échantillon
  view.setUint16(34, 8, true); // bits par échantillon
  text(36, 'data');
  view.setUint32(40, size, true);
  bytes.fill(128, 44); // 128 = silence en PCM 8 bits
  return bytes;
}

/** La télécommande est-elle possible sur cet appareil ? */
export const remoteSupported = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof window.Audio === 'function';

/** @returns {RemoteState} */
export const getRemoteState = () => state;

/**
 * @param {() => void} fn
 * @returns {() => void} Désabonnement.
 */
export function subscribeRemote(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** @param {Partial<RemoteState>} patch */
function update(patch) {
  state = { ...state, ...patch };
  listeners.forEach(fn => fn());
}

/**
 * @param {string} action
 * @param {(() => void) | null} fn
 */
function setHandler(action, fn) {
  try {
    navigator.mediaSession.setActionHandler(/** @type {MediaSessionAction} */ (action), fn);
  } catch { /* action non prise en charge par ce navigateur */ }
}

const ACTIONS = ['play', 'pause', 'nexttrack', 'previoustrack', 'stop'];

function clearSession() {
  ACTIONS.forEach(a => setHandler(a, null));
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
}

// Coupure par le système (appel, musique d'une autre app) : la télécommande s'arrête, l'app propose de reprendre.
function onPause() {
  if (stopping || !state.active) return;
  clearSession();
  update({ active: false, interrupted: true });
}

/**
 * Démarre la télécommande pour `target`. À appeler depuis un toucher (lecture audio autorisée).
 * @param {string} target
 * @returns {Promise<boolean>} false si l'appareil ou le navigateur refuse la lecture.
 */
export async function startRemote(target) {
  if (!remoteSupported()) return false;
  if (!audio) {
    audio = new Audio(URL.createObjectURL(new Blob([silentWav()], { type: 'audio/wav' })));
    audio.loop = true;
    audio.addEventListener('pause', onPause);
  }
  try {
    await audio.play();
  } catch {
    return false;
  }
  navigator.mediaSession.playbackState = 'playing';
  update({ active: true, target, interrupted: false });
  return true;
}

/** Arrête la télécommande et retire les commandes de l'écran verrouillé. */
export function stopRemote() {
  stopping = true;
  audio?.pause();
  stopping = false;
  if (remoteSupported()) clearSession();
  update({ active: false, target: null, interrupted: false });
}

// Un appui sur « pause » ne doit pas couper la lecture : elle porte la télécommande.
const keepPlaying = () => {
  audio?.play().catch(() => {});
  navigator.mediaSession.playbackState = 'playing';
};

/**
 * Commandes : appui simple sur les écouteurs (lecture / pause) et « suivant » = `plus` ; « précédent » = `minus`.
 * @param {{ plus: () => void, minus: () => void }} handlers
 */
export function setRemoteHandlers({ plus, minus }) {
  setHandler('play', () => { keepPlaying(); plus(); });
  setHandler('pause', () => { keepPlaying(); plus(); });
  setHandler('nexttrack', plus);
  setHandler('previoustrack', minus);
  setHandler('stop', stopRemote);
}

/**
 * Texte et image du lecteur de l'écran verrouillé.
 * @param {{ title: string, artist?: string, album?: string, image?: string }} info
 */
export function setRemoteInfo({ title, artist = '', album = '', image }) {
  if (typeof MediaMetadata !== 'function') return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title, artist, album,
    artwork: image ? [{ src: image, sizes: '96x96', type: 'image/png' }] : []
  });
}
