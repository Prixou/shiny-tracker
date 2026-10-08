import { useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff, ExternalLink, CheckCircle2, Trash2, ShieldCheck, Loader2, Globe } from 'lucide-react';
import { PROVIDERS, CLAUDE_MODELS, activeModel } from '../lib/ai/config.js';
import { Sheet, Segmented, Field, Toggle, useToast } from './ui.jsx';
import { feedback } from '../lib/hooks.js';

const STEPS = {
  gemini: ['Ouvre Google AI Studio avec ton compte Google.', 'Appuie sur « Create API key » (« Créer une clé API »).', 'Copie la clé et colle-la ci-dessous.'],
  claude: ['Ouvre la console Anthropic et ajoute quelques dollars de crédit (Billing).', 'Dans « API keys », crée une clé.', 'Copie la clé et colle-la ci-dessous.']
};

/** Réglages de l'assistant : fournisseur, clé API (gardée sur l'appareil), modèle et préférences. */
export default function AiSettingsSheet({ open, onClose, cfg, onChange }) {
  const toast = useToast();
  const provider = PROVIDERS[cfg.provider];
  const [draft, setDraft] = useState('');
  const [reveal, setReveal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [profile, setProfile] = useState(cfg.profile || '');

  useEffect(() => {
    if (open) { setDraft(cfg.keys[cfg.provider] || ''); setReveal(false); setProfile(cfg.profile || ''); }
  }, [open, cfg.provider, cfg.keys, cfg.profile]);

  const setProvider = id => onChange({ ...cfg, provider: id });
  const savedKey = cfg.keys[cfg.provider] || '';
  const geminiModels = cfg.geminiModels || [];
  const model = activeModel(cfg);

  const verify = async () => {
    const key = draft.trim();
    if (!key) return;
    setChecking(true);
    try {
      if (cfg.provider === 'gemini') {
        const { listModels } = await import('../lib/ai/gemini.js');
        const models = await listModels(key);
        const current = cfg.models.gemini;
        const pick = models.some(m => m.id === current) ? current : models[0]?.id || PROVIDERS.gemini.defaultModel;
        onChange({ ...cfg, keys: { ...cfg.keys, gemini: key }, geminiModels: models, models: { ...cfg.models, gemini: pick } });
      } else {
        const { checkKey } = await import('../lib/ai/claude.js');
        await checkKey(key, model);
        onChange({ ...cfg, keys: { ...cfg.keys, claude: key } });
      }
      feedback.success();
      toast('Clé vérifiée : l\'assistant est prêt ✨');
    } catch (err) {
      const mod = await import(cfg.provider === 'gemini' ? '../lib/ai/gemini.js' : '../lib/ai/claude.js');
      toast(mod.describeError(err) || 'Vérification annulée.', { type: 'error', duration: 6000 });
    } finally {
      setChecking(false);
    }
  };

  const removeKey = () => {
    const keys = { ...cfg.keys };
    delete keys[cfg.provider];
    onChange({ ...cfg, keys });
    setDraft('');
    toast('Clé supprimée de cet appareil', { type: 'info' });
  };

  const saveProfile = () => {
    if ((cfg.profile || '') !== profile) onChange({ ...cfg, profile });
  };

  return (
    <Sheet open={open} onClose={() => { saveProfile(); onClose(); }} title="Réglages de l'assistant" icon={<KeyRound className="w-5 h-5" />}>
      <div className="space-y-5">
        <Segmented value={cfg.provider} onChange={setProvider}
          options={Object.values(PROVIDERS).map(p => ({ id: p.id, label: `${p.name} (${p.badge.toLowerCase()})` }))} />

        <p className="text-sm text-slate-400 leading-relaxed">{provider.note}</p>

        <ol className="space-y-1.5 text-sm text-slate-300 list-decimal pl-5">
          {STEPS[cfg.provider].map(step => <li key={step}>{step}</li>)}
        </ol>
        <a href={provider.keyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
          <ExternalLink className="w-4 h-4" /> {cfg.provider === 'gemini' ? 'Ouvrir Google AI Studio' : 'Ouvrir la console Anthropic'}
        </a>

        <Field label="Clé API" hint={provider.keyHint}>
          <div className="flex gap-2">
            <input
              type={reveal ? 'text' : 'password'}
              className="input font-mono"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Colle ta clé ici"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button type="button" onClick={() => setReveal(r => !r)} className="icon-btn w-12 h-12 bg-slate-950 border border-slate-800" aria-label={reveal ? 'Masquer la clé' : 'Afficher la clé'}>
              {reveal ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </Field>
        <button className="btn-primary w-full" onClick={verify} disabled={!draft.trim() || checking}>
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : savedKey && savedKey === draft.trim() ? <CheckCircle2 className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
          {checking ? 'Vérification…' : savedKey && savedKey === draft.trim() ? 'Clé enregistrée · revérifier' : 'Vérifier et enregistrer'}
        </button>

        {cfg.provider === 'gemini' ? (
          <Field label="Modèle" hint="Flash-Lite : environ 500 requêtes gratuites par jour. Flash : plus fin mais une vingtaine seulement. Une question peut compter plusieurs requêtes quand l'assistant consulte l'app.">
            <select className="input" value={model} onChange={e => onChange({ ...cfg, models: { ...cfg.models, gemini: e.target.value } })}>
              {!geminiModels.some(m => m.id === model) && <option value={model}>{model}</option>}
              {geminiModels.map(m => <option key={m.id} value={m.id}>{m.name}{m.preview ? ' (préversion)' : ''}</option>)}
            </select>
          </Field>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400">Modèle</div>
            {CLAUDE_MODELS.map(m => (
              <button key={m.id} type="button" onClick={() => onChange({ ...cfg, models: { ...cfg.models, claude: m.id } })} aria-pressed={model === m.id}
                className={`w-full text-left min-h-14 px-4 py-2.5 rounded-2xl border transition ${model === m.id ? 'bg-amber-500/15 border-amber-500' : 'bg-slate-950 border-slate-800'}`}>
                <div className="text-sm font-black text-white">{m.name}</div>
                <div className="text-xs text-slate-400">{m.desc}</div>
              </button>
            ))}
            <div className="card px-4 mt-3">
              <Toggle icon={<Globe className="w-5 h-5" />} checked={cfg.webSearch !== false} onChange={webSearch => onChange({ ...cfg, webSearch })}
                label="Recherche web" desc="Pour l'actualité (raids, évènements, codes). Environ 1 centime par recherche, 3 au plus par question." />
            </div>
          </div>
        )}

        <Field label="Ce que l'assistant doit savoir sur toi" hint="Envoyé avec chaque nouvelle conversation.">
          <textarea className="input py-3 min-h-28 resize-y" value={profile} onChange={e => setProfile(e.target.value)} onBlur={saveProfile} maxLength={600}
            placeholder="Ex. : J'aime chasser sur 3DS. Pas de Pokémon GO pour mon living dex. J'ai le Charme Chroma dans tous mes jeux." />
        </Field>

        <div className="flex gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>Ta clé reste sur ce téléphone : elle n'est jamais incluse dans les sauvegardes, les QR codes ni la synchronisation cloud. Quand tu poses une question, l'assistant envoie à {provider.name} les données utiles (shiny, chasses, objectifs).</span>
        </div>

        {savedKey && (
          <button className="btn-secondary w-full text-rose-300" onClick={removeKey}><Trash2 className="w-4 h-4" /> Supprimer la clé {provider.name}</button>
        )}
      </div>
    </Sheet>
  );
}
