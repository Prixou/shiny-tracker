import { Vibrate, Volume2, Sun, PauseCircle, Palette, ShieldAlert, AlertTriangle, Sparkles, Trash2, Info } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { GAMES, SHINY_METHODS } from '../data/constants.js';
import { POKEDEX } from '../data/pokedex.js';
import { Toggle, Field, useConfirm, useToast } from '../components/ui.jsx';
import { feedback } from '../lib/hooks.js';

export default function SettingsTool() {
  const { settings, setSettings, resetAll } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const wakeLockSupported = 'wakeLock' in navigator;
  const vibrateSupported = 'vibrate' in navigator;

  const reset = async () => {
    const ok = await confirm({ title: 'Tout effacer ?', message: 'Tous tes shiny, chasses, objectifs et réglages seront supprimés de cet appareil. Fais une sauvegarde avant si besoin. Cette action est irréversible.', confirmLabel: 'Tout effacer', danger: true });
    if (ok) { resetAll(); toast('Données effacées', { type: 'info' }); }
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
        <Toggle icon={<ShieldAlert className="w-5 h-5" />} checked={settings.hideLocked} onChange={hideLocked => setSettings({ hideLocked })}
          label="Masquer les Shiny Lock" desc="Cache du Pokédex les Pokémon impossibles à chasser (sauf s'ils sont capturés)" />
        <Toggle icon={<AlertTriangle className="w-5 h-5" />} checked={settings.confirmUncatch} onChange={confirmUncatch => setSettings({ confirmUncatch })}
          label="Confirmer avant de décocher" desc="Demande confirmation si la capture contient des détails" />
      </section>

      <section className="card p-4 space-y-4">
        <h3 className="label-caps flex items-center gap-2"><Sparkles className="w-4 h-4" /> Valeurs par défaut</h3>
        <Field label="Jeu principal">
          <select className="input" value={settings.defaultGame} onChange={e => setSettings({ defaultGame: e.target.value })}>
            {GAMES.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
        </Field>
        <Field label="Méthode principale">
          <select className="input" value={settings.defaultMethod} onChange={e => setSettings({ defaultMethod: e.target.value })}>
            {SHINY_METHODS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>
        </Field>
        <Toggle checked={settings.charm} onChange={charm => setSettings({ charm })} label="J'ai le Charme Chroma" desc="Utilisé pour pré-remplir les taux des nouvelles chasses" />
      </section>

      <section className="card p-4 space-y-3">
        <h3 className="label-caps flex items-center gap-2"><Info className="w-4 h-4" /> À propos</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Shiny Hunter Pro v{__APP_VERSION__} · {POKEDEX.length} Pokémon (espèces + formes régionales).
          Données et sprites : <a className="text-amber-400 underline" href="https://pokeapi.co" target="_blank" rel="noopener noreferrer">PokéAPI</a>.
          Tes données restent sur ton appareil. Pokémon est une marque de Nintendo / Game Freak / The Pokémon Company ; application de fan non officielle.
        </p>
        <button className="btn-secondary w-full text-rose-300" onClick={reset}><Trash2 className="w-4 h-4" /> Effacer toutes les données</button>
      </section>
    </div>
  );
}
