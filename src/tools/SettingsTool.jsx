import { useState } from 'react';
import { Vibrate, Volume2, Sun, PauseCircle, Palette, ShieldAlert, AlertTriangle, Sparkles, Trash2, Info, Layers, Film, ListPlus, Gamepad2, ChevronRight } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { MAIN_DEX, POKEDEX } from '../data/pokedex.js';
import ListsSheet from '../components/ListsSheet.jsx';
import MyGamesSheet from '../components/MyGamesSheet.jsx';
import { Toggle, Field, useConfirm } from '../components/ui.jsx';
import { feedback } from '../lib/hooks.js';
import GameOptions from '../components/GameOptions.jsx';

export default function SettingsTool() {
  const { settings, setSettings, resetAll } = useStore();
  const confirm = useConfirm();
  const [showLists, setShowLists] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const myCount = settings.myGames?.length || 0;
  const charmCount = Object.values(settings.charmGames || {}).filter(Boolean).length;
  const wakeLockSupported = 'wakeLock' in navigator;
  const vibrateSupported = 'vibrate' in navigator;

  const reset = async () => {
    const ok = await confirm({ title: 'Tout effacer ?', message: 'Tous tes shiny, chasses, listes et réglages seront supprimés de cet appareil. Tu pourras annuler juste après, mais fais une sauvegarde avant si besoin.', confirmLabel: 'Tout effacer', danger: true });
    if (ok) resetAll();
  };

  return (
    <div className="space-y-4">
      <section className="card px-4 py-1 divide-y divide-slate-800">
        <Toggle icon={<Vibrate className="w-5 h-5" />} checked={settings.haptics} onChange={haptics => { setSettings({ haptics }); if (haptics) navigator.vibrate?.(30); }}
          label="Vibrations" desc={vibrateSupported ? 'Retour haptique à chaque rencontre comptée' : 'Non pris en charge par cet appareil (iPhone)'} />
        <Toggle icon={<Volume2 className="w-5 h-5" />} checked={settings.sound} onChange={sound => { setSettings({ sound }); feedback.enabledSound = sound; feedback.beep(); }}
          label="Sons" desc="Petit bip à chaque rencontre" />
        <Toggle icon={<Sun className="w-5 h-5" />} checked={settings.keepAwake} onChange={keepAwake => setSettings({ keepAwake })}
          label="Garder l'écran allumé" desc={wakeLockSupported ? 'Pendant qu\'une chasse est affichée' : 'Non pris en charge par ce navigateur'} />
        <Toggle icon={<PauseCircle className="w-5 h-5" />} checked={settings.autoPause} onChange={autoPause => setSettings({ autoPause })}
          label="Pause auto du chrono" desc="Met les chronomètres en pause quand l'app passe en arrière-plan" />
      </section>

      <section className="card px-4 py-1 divide-y divide-slate-800">
        <Toggle icon={<Palette className="w-5 h-5" />} checked={settings.colorUncaught} onChange={colorUncaught => setSettings({ colorUncaught })}
          label="Couleurs des non capturés" desc="Affiche les sprites manquants en couleur plutôt qu'en gris" />
        <Toggle icon={<Layers className="w-5 h-5" />} checked={settings.showVariants} onChange={showVariants => setSettings({ showVariants })}
          label="Afficher les variantes" desc={`Formes alternatives, Méga, Gigamax et différences mâle/femelle (${POKEDEX.length - MAIN_DEX.length} de plus)`} />
        <Toggle icon={<Film className="w-5 h-5" />} checked={settings.animatedSprites} onChange={animatedSprites => setSettings({ animatedSprites })}
          label="Sprites animés" desc="Dans la fiche d'un Pokémon (quand ils existent)" />
        <Toggle icon={<ShieldAlert className="w-5 h-5" />} checked={settings.hideLocked} onChange={hideLocked => setSettings({ hideLocked })}
          label="Masquer les Shiny Lock" desc="Cache du Pokédex les Pokémon impossibles à chasser (sauf s'ils sont capturés)" />
        <Toggle icon={<AlertTriangle className="w-5 h-5" />} checked={settings.confirmUncatch} onChange={confirmUncatch => setSettings({ confirmUncatch })}
          label="Confirmer avant de décocher" desc="Demande confirmation si la capture contient des détails" />
      </section>

      <section className="card p-4 space-y-4">
        <h3 className="label-caps flex items-center gap-2"><Sparkles className="w-4 h-4" /> Valeurs par défaut</h3>
        <Field label="Jeu principal">
          <select className="input" value={settings.defaultGame} onChange={e => setSettings({ defaultGame: e.target.value })}>
            <GameOptions />
          </select>
        </Field>
        <button onClick={() => setShowGames(true)} className="w-full flex items-center gap-3 min-h-14 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-left active:bg-slate-800">
          <Gamepad2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-slate-100">Mes jeux et Charmes Chroma</span>
            <span className="block text-xs text-slate-400">{myCount ? `${myCount} jeu${myCount > 1 ? 'x' : ''} · Charme dans ${charmCount}` : 'Non renseigné : tous les jeux sont proposés'}</span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </button>
        <Toggle checked={settings.charm} onChange={charm => setSettings({ charm })} label="Charme Chroma par défaut" desc="Pour les jeux non précisés dans « Mes jeux »" />
      </section>

      <section className="card p-4 space-y-3">
        <h3 className="label-caps flex items-center gap-2"><Info className="w-4 h-4" /> À propos</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Shiny Hunter Pro v{__APP_VERSION__} · {MAIN_DEX.length} Pokémon (espèces + formes régionales) et {POKEDEX.length - MAIN_DEX.length} variantes.
          Données et sprites : <a className="text-amber-400 underline" href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">PokéAPI</a>.
          Tes données restent sur ton appareil. Pokémon est une marque de Nintendo / Game Freak / The Pokémon Company ; application de fan non officielle.
        </p>
        <button className="btn-secondary w-full" onClick={() => setShowLists(true)}><ListPlus className="w-4 h-4" /> Gérer mes listes</button>
        <button className="btn-secondary w-full text-rose-300" onClick={reset}><Trash2 className="w-4 h-4" /> Effacer toutes les données</button>
      </section>
      <ListsSheet open={showLists} onClose={() => setShowLists(false)} />
      <MyGamesSheet open={showGames} onClose={() => setShowGames(false)} />
    </div>
  );
}
