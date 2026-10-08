// Mise en forme des nombres, taux, durées et dates (affichage en français).

export const fmtNumber = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

export const fmtOdds = odds => `1/${Math.round(odds || 0)}`;

export const fmtRatio = r => (r > 0 && r < 0.01 ? '< 0,01×' : `${r.toFixed(2).replace('.', ',')}×`);

export const fmtPercent = (p, digits = 1) => {
  const v = p * 100;
  if (v > 0 && v < 0.1) return '< 0,1 %';
  if (v > 99.9 && v < 100) return '> 99,9 %';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: 0 })} %`;
};

export const padId = id => `#${String(id).padStart(4, '0')}`;

export const formatDuration = (ms, { short = false } = {}) => {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (short) {
    if (h >= 100) return `${h} h`;
    if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
    if (m > 0) return `${m} min`;
    return `${s} s`;
  }
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** Date locale « AAAA-MM-JJ » d'un horodatage (et non la date UTC de toISOString). */
export const isoFromTimestamp = ts => {
  const d = new Date(ts || Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const todayIso = () => isoFromTimestamp(Date.now());

/** Horodatage de midi (heure locale) d'une date « AAAA-MM-JJ ». */
export const timestampFromIso = iso => new Date(`${iso}T12:00:00`).getTime();

export const formatDate = iso => {
  if (!iso) return 'Date inconnue';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const monthLabel = key => {
  const [y, m] = key.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};
