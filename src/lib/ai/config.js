// Réglages de l'assistant IA. Stockés à part (clé « shp:ai ») : jamais inclus dans les
// sauvegardes, les QR codes ni la synchronisation cloud, pour que la clé API reste sur l'appareil.
const KEY = 'shp:ai';
export const CHAT_KEY = 'shp:ai-chat';

export const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    badge: 'Gratuit',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHint: 'Commence par « AIza »',
    // Modèle choisi par défaut si la liste des modèles n'a pas pu être lue.
    defaultModel: 'gemini-flash-lite-latest',
    note: 'Clé gratuite créée sur Google AI Studio avec ton compte Google, sans carte bancaire. Quota limité par jour (environ 500 requêtes en Flash-Lite, une vingtaine en Flash). Sur l\'offre gratuite, Google peut utiliser tes questions pour améliorer ses produits.'
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    badge: 'Payant',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHint: 'Commence par « sk-ant- »',
    defaultModel: 'claude-opus-5-5',
    note: 'Clé API créée sur la console Anthropic, avec des crédits prépayés (séparés de l\'abonnement Claude). Tes questions ne servent pas à entraîner les modèles.'
  }
};

// Coût indicatif d'une question (≈ 5 000 jetons envoyés, 500 reçus).
export const CLAUDE_MODELS = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', desc: 'Le plus intelligent · ≈ 0,03 $ par question' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', desc: 'Équilibré · ≈ 0,015 $ par question' },
  { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', desc: 'Le plus économique · < 0,001 $ par question' }
];

const DEFAULTS = { provider: 'gemini', keys: {}, models: {} };

export function loadAiConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { ...DEFAULTS, ...(raw || {}), keys: { ...(raw?.keys || {}) }, models: { ...(raw?.models || {}) } };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAiConfig(cfg) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    // Stockage indisponible (navigation privée) : la configuration reste en mémoire.
  }
}

export const activeModel = cfg => cfg.models[cfg.provider] || PROVIDERS[cfg.provider].defaultModel;
export const isConfigured = cfg => !!cfg.keys[cfg.provider];

export function loadChat() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHAT_KEY) || 'null');
    return raw && Array.isArray(raw.items) ? raw : null;
  } catch {
    return null;
  }
}

export function saveChat(chat) {
  try {
    if (chat) localStorage.setItem(CHAT_KEY, JSON.stringify(chat));
    else localStorage.removeItem(CHAT_KEY);
  } catch {
    // Conversation non conservée : sans gravité.
  }
}
