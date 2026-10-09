import { describe, it, expect } from 'vitest';
import { silentWav } from '../../src/lib/mediaRemote.js';
import { createHunt, remoteInfo } from '../../src/domain/hunt.js';
import { fmtNumber } from '../../src/lib/format.js';

const ascii = (bytes, from, to) => String.fromCharCode(...bytes.slice(from, to));

describe('compteur aux écouteurs', () => {
  it('génère un WAV de silence valide, assez long pour le lecteur d\'Android (≥ 5 s)', () => {
    const wav = silentWav(6);
    const view = new DataView(wav.buffer);
    expect(ascii(wav, 0, 4)).toBe('RIFF');
    expect(ascii(wav, 8, 16)).toBe('WAVEfmt ');
    expect(view.getUint32(24, true)).toBe(8000);
    const size = view.getUint32(40, true);
    expect(size / 8000).toBe(6);
    expect(wav.length).toBe(44 + size);
    expect(view.getUint32(4, true)).toBe(36 + size);
    expect(wav.slice(44).every(b => b === 128)).toBe(true);
  });

  it('écran verrouillé : Pokémon et compteur, taux et chance cumulée', () => {
    const hunt = { ...createHunt({ targetId: '133', game: 'sv', method: 'sv_wild' }), count: 1234 };
    const info = remoteInfo(hunt);
    expect(info.title).toBe(`Évoli · ${fmtNumber(1234)}`); // espace fine insécable du français
    expect(info.artist).toMatch(/^1\/\d+ · \d+(,\d)? % de chance cumulée$/);
    expect(info.image).toMatch(/133\.png$/);
  });
});
