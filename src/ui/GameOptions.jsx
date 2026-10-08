import { GAMES, PLATFORMS } from '../data/games.js';

/** Options de <select> regroupées par console. `filter` limite les jeux proposés. */
export default function GameOptions({ filter = () => true }) {
  return PLATFORMS.map(pl => {
    const games = GAMES.filter(g => g.platform === pl.id && filter(g));
    if (!games.length) return null;
    return (
      <optgroup key={pl.id} label={pl.name}>
        {games.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
      </optgroup>
    );
  });
}
