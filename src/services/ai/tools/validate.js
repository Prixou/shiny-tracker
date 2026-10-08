// Validation légère des arguments envoyés par le modèle.

/** Vérifie les arguments d'un appel selon le schéma de l'outil (les modèles peuvent se tromper). */
export function validate(def, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Arguments invalides : un objet JSON est attendu.');
  for (const key of def.schema.required || []) {
    if (args[key] == null || args[key] === '') throw new Error(`Argument manquant : ${key}.`);
  }
  for (const [key, value] of Object.entries(args)) {
    const spec = def.schema.properties[key];
    if (!spec) continue;
    const ok = spec.type === 'integer' ? Number.isFinite(Number(value))
      : spec.type === 'boolean' ? typeof value === 'boolean'
        : spec.type === 'array' ? Array.isArray(value) && value.every(v => typeof v === 'string' || typeof v === 'number')
          : typeof value === 'string';
    if (!ok) throw new Error(`Argument « ${key} » : type ${spec.type} attendu.`);
    if (spec.enum && !spec.enum.includes(value)) throw new Error(`Argument « ${key} » : valeur parmi ${spec.enum.join(', ')} attendue.`);
  }
}

/** Entier entre 1 et `max`, `def` par défaut. */
export const clampInt = (v, def, max) => Math.min(max, Math.max(1, Math.round(Number(v) || def)));
