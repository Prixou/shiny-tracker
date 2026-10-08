// Visuels Pokémon : sprites, types, Poké Balls, régions.
import { useEffect, useState } from 'react';
import { TYPE_BY_ID, ballSprite, BALL_BY_ID } from '../data/constants.js';
import { spriteUrl } from '../data/pokedex.js';

// Image avec repli discret si le sprite n'existe pas / hors ligne.
export function Sprite({ pokemon, src, className = 'w-16 h-16', alt, pixel = true, ...rest }) {
  const [failed, setFailed] = useState(false);
  const url = src || spriteUrl(pokemon);
  useEffect(() => setFailed(false), [url]);
  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center text-slate-600`} aria-label={alt || pokemon?.name}>
        <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt ?? pokemon?.name ?? ''}
      className={`${className} object-contain ${pixel ? 'pixelated' : ''}`}
      loading="lazy"
      decoding="async"
      draggable="false"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

/** Pastille de région : numéro de génération sur la couleur de la région (mono : blanche, pour les boutons colorés). */
export function RegionIcon({ region, className = 'w-5 h-5', mono = false }) {
  const bg = mono ? '#fff' : region?.color;
  const fg = mono ? region?.color : '#fff';
  const label = String(region?.gen ?? '?');
  const size = label.length > 1 ? 10 : 12.5;
  // SVG : chiffre centré optiquement (ligne de base décalée de la moitié de la hauteur des chiffres).
  return (
    <svg viewBox="0 0 20 20" className={`${className} shrink-0`} aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill={bg} />
      <circle cx="10" cy="10" r="8.6" fill="none" stroke={fg} strokeOpacity=".28" strokeWidth=".9" />
      <text x="10" y={10 + size * 0.355} textAnchor="middle" fontSize={size} fontWeight="900" fill={fg}
        style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>{label}</text>
    </svg>
  );
}

// Hors ligne (sprite pas encore en cache), l'icône est masquée plutôt que de laisser déborder son texte alternatif.
export const BallIcon = ({ id, className = 'w-6 h-6' }) => (
  <img src={ballSprite(id)} alt={BALL_BY_ID[id]?.name || 'Poké Ball'} title={BALL_BY_ID[id]?.name} className={`${className} object-contain pixelated`} loading="lazy" draggable="false"
    onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
);

const TYPE_ICON_URL = id => `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${id}.svg`;

export function TypeIcon({ type, className = 'w-3.5 h-3.5' }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`${className} rounded-full bg-white/70 inline-block`} />;
  return <img src={TYPE_ICON_URL(type)} alt="" className={`${className} object-contain`} onError={() => setFailed(true)} loading="lazy" />;
}

export function TypeBadge({ type, small = false }) {
  const t = TYPE_BY_ID[type];
  if (!t) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ backgroundColor: t.color, textShadow: '0 1px 1px rgba(0,0,0,.35)' }}
    >
      <TypeIcon type={type} className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {t.name}
    </span>
  );
}
