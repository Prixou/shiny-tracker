import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Timer, Plus, Minus, Play, Pause, Sparkles, Settings2, Trash2, GitBranch, History,
  RotateCcw, Sun, Zap, Clock, TrendingUp, Target, ChevronRight, Egg, Link2
} from 'lucide-react';
import { useStore, huntElapsed, huntTotal, huntChance, huntOdds } from '../state/store.jsx';
import { useNav } from '../state/nav.jsx';
import { getPokemon } from '../data/pokedex.js';
import { GAME_BY_ID } from '../data/constants.js';
import { METHOD_BY_ID, encountersFor, oddsContext, isDynamic, luckRatio, oddsAt } from '../data/methods.js';
import { useNow, useWakeLock, feedback } from '../lib/hooks.js';
import { fmtNumber, fmtOdds, fmtRatio, fmtPercent, formatDuration, getLuckTier, formatDate, isoFromTimestamp } from '../lib/utils.js';
import { Sheet, Field, Sprite, EmptyState, useToast, useConfirm } from '../components/ui.jsx';
import CaptureForm from '../components/CaptureForm.jsx';
import PokemonPicker from '../components/PokemonPicker.jsx';
import Celebration from '../components/Celebration.jsx';
import OddsConfig from '../components/OddsConfig.jsx';

const EGGS_PER_BOX = 30;

export default function HuntsView() {
  const { hunts, ui, settings, setUiValue } = useStore();
  const { openNewHunt } = useNav();
  const [showHistory, setShowHistory] = useState(false);
  const [celebrate, setCelebrate] = useState(null);

  const active = useMemo(() => hunts.filter(h => h.status === 'active').sort((a, b) => b.updatedAt - a.updatedAt), [hunts]);
  const done = useMemo(() => hunts.filter(h => h.status === 'done').sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)), [hunts]);
  const current = active.find(h => h.id === ui.activeHuntId) || active[0] || null;
  const anyRunning = hunts.some(h => h.startedAt);
  const now = useNow(anyRunning);
  const wakeLocked = useWakeLock(settings.keepAwake && !!current);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 -mx-4 px-4 overflow-x-auto no-scrollbar">
        {active.map(h => {
          const p = getPokemon(h.targetId);
          const selected = current?.id === h.id;
          return (
            <button key={h.id} onClick={() => setUiValue('activeHuntId', h.id)}
              className={`shrink-0 flex items-center gap-1.5 pl-1 pr-3 h-12 rounded-2xl border transition ${selected ? 'bg-amber-500/15 border-amber-500/60' : 'bg-slate-900 border-slate-800'}`}>
              <Sprite pokemon={p} className="w-10 h-10" />
              <span className="text-left leading-tight">
                <span className={`block text-xs font-bold max-w-24 truncate ${selected ? 'text-amber-200' : 'text-slate-300'}`}>{p?.name}</span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  {h.startedAt && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {fmtNumber(huntTotal(h))}
                </span>
              </span>
            </button>
          );
        })}
        <button onClick={() => openNewHunt()} className="shrink-0 flex items-center gap-1.5 px-4 h-12 rounded-2xl border border-dashed border-amber-500/50 text-amber-400 text-sm font-bold active:bg-amber-500/10">
          <Plus className="w-4 h-4" /> Nouvelle
        </button>
      </div>

      {current ? (
        <ActiveHunt key={current.id} hunt={current} now={now} wakeLocked={wakeLocked} onFound={setCelebrate} />
      ) : (
        <EmptyState icon={<Timer className="w-7 h-7" />} title="Aucune chasse en cours"
          action={<button className="btn-primary" onClick={() => openNewHunt()}><Plus className="w-4 h-4" /> Lancer une chasse</button>}>
          Choisis un Pokémon, un jeu et une méthode : le taux est calculé automatiquement, même quand il évolue avec ta chaîne.
        </EmptyState>
      )}

      {done.length > 0 && (
        <button onClick={() => setShowHistory(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-sm font-bold text-slate-300">
          <span className="flex items-center gap-2"><History className="w-4 h-4 text-slate-400" /> Chasses terminées</span>
          <span className="flex items-center gap-1 text-slate-500">{done.length}<ChevronRight className="w-4 h-4" /></span>
        </button>
      )}

      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} hunts={done} />
      <Celebration data={celebrate} onClose={() => setCelebrate(null)} />
    </div>
  );
}

function ActiveHunt({ hunt, now, wakeLocked, onFound }) {
  const { increment, toggleTimer } = useStore();
  const { openPokemon } = useNav();
  const [sheet, setSheet] = useState(null);
  const [bump, setBump] = useState(0);
  const p = getPokemon(hunt.targetId);
  const game = GAME_BY_ID[hunt.game];
  const method = METHOD_BY_ID[hunt.method] || METHOD_BY_ID.other;
  const ctx = oddsContext(hunt);
  const dynamic = isDynamic(ctx);
  const unit = method.unit || 'rencontres';
  const total = huntTotal(hunt);
  const elapsed = huntElapsed(hunt, now);
  const chance = huntChance(hunt);
  const ratio = luckRatio(chance);
  const luck = getLuckTier(total > 0 ? ratio : null);
  const odds = huntOdds(hunt);
  const hours = elapsed / 3600000;
  const rate = hours > 0.01 ? total / hours : 0;
  const need90 = encountersFor(hunt, 0.9);
  const quickSteps = method.eggs ? [5, EGGS_PER_BOX] : [5, 10];

  const add = useCallback(n => {
    increment(hunt.id, n);
    setBump(b => b + 1);
    feedback.tap();
  }, [increment, hunt.id]);
  const plus = useCallback(() => add(hunt.step), [add, hunt.step]);
  const minus = useCallback(() => {
    if (hunt.count <= 0) return;
    increment(hunt.id, -hunt.step);
    feedback.undo();
  }, [increment, hunt.id, hunt.step, hunt.count]);

  // Raccourcis clavier (ordinateur / clavier Bluetooth) : Espace, Entrée, ↑, + / ↓, -
  useEffect(() => {
    const onKey = e => {
      if (sheet || document.documentElement.classList.contains('sheet-open')) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.repeat && e.key !== 'ArrowUp') return;
      if ([' ', 'Enter', 'ArrowUp', '+', '='].includes(e.key)) { e.preventDefault(); plus(); }
      if (['ArrowDown', '-', 'Backspace'].includes(e.key)) { e.preventDefault(); minus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plus, minus, sheet]);

  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => openPokemon(hunt.targetId)} className="shrink-0 rounded-2xl bg-slate-950 border border-slate-800 p-1" aria-label={`Fiche de ${p?.name}`}>
            <Sprite pokemon={p} className="w-16 h-16 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white truncate">{p?.name || 'Pokémon inconnu'}</h2>
            <div className="text-xs text-slate-400 truncate">{game?.icon} {game?.short} · {method.icon} {method.name}</div>
            <div className="text-xs font-mono text-amber-400/90 mt-0.5 truncate">
              {fmtOdds(odds)}{dynamic ? ` (chaîne ${hunt.count})` : ''}{ctx.x.charm ? ' · Charme ✦' : ''}{ctx.custom ? ' · perso' : ''}{hunt.step > 1 ? ` · +${hunt.step}` : ''}
            </div>
          </div>
          <button onClick={() => setSheet('edit')} className="icon-btn bg-slate-950 border border-slate-800" aria-label="Paramètres de la chasse">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => { toggleTimer(hunt.id); feedback.tap(); }}
            className={`flex-1 flex items-center justify-center gap-2 min-h-12 rounded-2xl border font-mono text-lg font-bold ${hunt.startedAt ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
            aria-label={hunt.startedAt ? 'Mettre le chrono en pause' : 'Démarrer le chrono'}>
            {hunt.startedAt ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {formatDuration(elapsed)}
          </button>
          {wakeLocked && (
            <span className="shrink-0 flex items-center gap-1 px-3 min-h-12 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-bold text-amber-300" title="L'écran reste allumé">
              <Sun className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      <button
        onClick={plus}
        className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/25 active:scale-[0.985] transition-transform select-none min-h-[36dvh] flex flex-col items-center justify-center gap-1"
        aria-label={`Ajouter ${hunt.step} ${unit}`}
      >
        {hunt.phases.length > 0 && <span className="text-xs font-black uppercase tracking-widest text-slate-900/60">Phase {hunt.phases.length + 1}</span>}
        <span key={bump} className="text-[clamp(4.5rem,24vw,9rem)] leading-none font-black font-mono tabular-nums animate-bump">{fmtNumber(hunt.count)}</span>
        <span className="text-sm font-black uppercase tracking-wider text-slate-900/70">{unit} · toucher pour +{hunt.step}</span>
        {method.eggs && hunt.count >= EGGS_PER_BOX && (
          <span className="text-xs font-bold text-slate-900/60">{Math.floor(hunt.count / EGGS_PER_BOX)} boîte{hunt.count >= 2 * EGGS_PER_BOX ? 's' : ''} + {hunt.count % EGGS_PER_BOX} œufs</span>
        )}
        {hunt.phases.length > 0 && <span className="text-xs font-bold text-slate-900/60">Total : {fmtNumber(total)}</span>}
      </button>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={minus} disabled={hunt.count <= 0} className="btn-secondary flex-col gap-0.5 min-h-16 px-1" aria-label={`Retirer ${hunt.step}`}>
          <Minus className="w-5 h-5" /><span className="text-[11px]">-{hunt.step}</span>
        </button>
        <button onClick={() => setSheet('phase')} className="btn-secondary flex-col gap-0.5 min-h-16 px-1">
          {dynamic ? <Link2 className="w-5 h-5" /> : <GitBranch className="w-5 h-5" />}
          <span className="text-[11px]">{dynamic ? 'Chaîne' : 'Phase'}</span>
        </button>
        <button onClick={() => setSheet('found')} className="col-span-2 btn-primary bg-emerald-500 active:bg-emerald-400 shadow-emerald-500/20 min-h-16">
          <Sparkles className="w-5 h-5" /> Shiny trouvé !
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickSteps.map(n => (
          <button key={n} onClick={() => add(n)} className="btn-secondary min-h-11 text-sm">
            {method.eggs && n === EGGS_PER_BOX ? <><Egg className="w-4 h-4" /> +1 boîte (30)</> : <>+{n}</>}
          </button>
        ))}
      </div>

      <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${luck.bg}`}>
        <span className="text-2xl">{luck.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-black ${luck.color}`}>{luck.name}</div>
          <div className="text-xs text-slate-300">{luck.desc}</div>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-400">Progression vers le taux</span>
          <span className={ratio > 1 ? 'text-rose-400' : 'text-amber-400'}>{ratio > 1 ? `Over odds ${fmtRatio(ratio)}` : `${Math.round(ratio * 100)} %`}</span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${ratio > 1 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-yellow-300'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={<Target className="w-4 h-4" />} label="Chance cumulée" value={fmtPercent(chance)} />
          <MiniStat icon={<TrendingUp className="w-4 h-4" />} label="Rythme" value={rate ? `${fmtNumber(rate)}/h` : '—'} />
          <MiniStat icon={<Zap className="w-4 h-4" />} label="Pour 90 %" value={fmtNumber(Math.max(0, need90 - hunt.count))} sub="restantes" />
          <MiniStat icon={<Clock className="w-4 h-4" />} label="Temps estimé (90 %)"
            value={rate && hunt.count < need90 ? formatDuration(((need90 - hunt.count) / rate) * 3600000, { short: true }) : '—'} />
        </div>
        {dynamic && (
          <p className="text-xs text-slate-400">
            Taux dynamique : {fmtOdds(oddsAt(hunt, 0))} au départ, {fmtOdds(oddsAt(hunt, method.chain))} à partir de {method.chain}. {method.note}
          </p>
        )}
      </div>

      {hunt.phases.length > 0 && <PhaseList hunt={hunt} dynamic={dynamic} />}

      <FoundSheet open={sheet === 'found'} onClose={() => setSheet(null)} hunt={hunt} onFound={onFound} />
      <PhaseSheet open={sheet === 'phase'} onClose={() => setSheet(null)} hunt={hunt} dynamic={dynamic} />
      <EditHuntSheet open={sheet === 'edit'} onClose={() => setSheet(null)} hunt={hunt} elapsed={elapsed} />
    </div>
  );
}

const MiniStat = ({ icon, label, value, sub }) => (
  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">{icon}{label}</div>
    <div className="text-base font-black font-mono text-slate-100 mt-0.5">{value} {sub && <span className="text-[11px] font-sans font-semibold text-slate-500">{sub}</span>}</div>
  </div>
);

function PhaseList({ hunt, dynamic }) {
  const { removePhase } = useStore();
  return (
    <div className="card p-4 space-y-2">
      <div className="label-caps">{dynamic ? 'Chaînes / phases' : 'Phases'} ({hunt.phases.length})</div>
      {hunt.phases.map((ph, i) => {
        const p = ph.key ? getPokemon(ph.key) : null;
        return (
          <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-slate-950 border border-slate-800">
            {p ? <Sprite pokemon={p} className="w-10 h-10" /> : <span className="w-10 h-10 flex items-center justify-center text-slate-500"><GitBranch className="w-4 h-4" /></span>}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-200 truncate">Phase {i + 1}{p ? ` · ${p.name}` : ''}</div>
              <div className="text-xs text-slate-500 truncate">{fmtNumber(ph.count)} · {formatDate(isoFromTimestamp(ph.at))}{ph.note ? ` · ${ph.note}` : ''}</div>
            </div>
            <button onClick={() => removePhase(hunt.id, i)} className="icon-btn w-9 h-9 text-slate-500" aria-label="Supprimer la phase"><Trash2 className="w-4 h-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

function FoundSheet({ open, onClose, hunt, onFound }) {
  const { finishHunt, catchesByKey } = useStore();
  const [details, setDetails] = useState(null);
  const p = getPokemon(hunt.targetId);
  useEffect(() => {
    if (open) setDetails({ ball: 'pokeball', date: new Date().toISOString().slice(0, 10), method: hunt.method, game: hunt.game, nickname: '', gender: '', notes: '' });
  }, [open, hunt.method, hunt.game]);
  if (!details) return null;
  const owned = catchesByKey[hunt.targetId]?.length || 0;
  const confirm = () => {
    const c = finishHunt(hunt.id, { ...details, timestamp: Date.now() });
    feedback.success();
    onClose();
    if (c) onFound({ pokemon: p, ratio: c.luck, count: c.count });
  };
  return (
    <Sheet open={open} onClose={onClose} title={`${p?.name} shiny !`} subtitle={`${fmtNumber(huntTotal(hunt))} ${METHOD_BY_ID[hunt.method]?.unit || 'rencontres'} · ${fmtOdds(huntOdds(hunt))}`}
      icon={<Sparkles className="w-5 h-5" />}
      footer={<button className="btn-primary w-full bg-emerald-500 active:bg-emerald-400" onClick={confirm}><Sparkles className="w-4 h-4" /> Enregistrer la capture</button>}>
      {owned > 0 && (
        <p className="mb-4 text-xs text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3">
          Tu possèdes déjà {owned} exemplaire{owned > 1 ? 's' : ''} de ce shiny : celui-ci sera ajouté en plus.
        </p>
      )}
      <CaptureForm value={details} onChange={patch => setDetails(d => ({ ...d, ...patch }))} showCounts={false} />
    </Sheet>
  );
}

function PhaseSheet({ open, onClose, hunt, dynamic }) {
  const { addPhase, addCatch } = useStore();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [register, setRegister] = useState(true);
  useEffect(() => { if (open) { setNote(''); setRegister(true); } }, [open]);
  const done = (p = null) => {
    addPhase(hunt.id, { key: p?.key || '', note });
    if (p && register) {
      addCatch(p.key, { method: hunt.method, opts: hunt.opts, game: hunt.game, count: hunt.count, odds: Math.round(huntOdds(hunt)), notes: `Phase de la chasse ${getPokemon(hunt.targetId)?.name || ''}` },
        `${p.name} ajouté (phase ${hunt.phases.length + 1})`);
    } else {
      toast(`${dynamic ? 'Chaîne' : 'Phase'} ${hunt.phases.length + 1} enregistrée à ${fmtNumber(hunt.count)}`);
    }
    feedback.success();
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={dynamic ? 'Chaîne rompue / phase' : 'Nouvelle phase'}
      subtitle={dynamic ? 'Le compteur (et la chaîne) repart à 0, le total est conservé.' : 'Un autre shiny est apparu ? Le compteur repart à 0, le total est conservé.'}
      icon={<GitBranch className="w-5 h-5" />} full
      footer={<button className="btn-secondary w-full" onClick={() => done(null)}>{dynamic ? 'Chaîne rompue (sans shiny)' : 'Enregistrer sans préciser le Pokémon'}</button>}>
      <div className="space-y-4">
        <Field label="Note (facultatif)">
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex. : fui, capturé, mauvais sexe…" />
        </Field>
        <div className="card px-4">
          <label className="flex items-center gap-3 py-3">
            <input type="checkbox" className="w-5 h-5 accent-amber-500" checked={register} onChange={e => setRegister(e.target.checked)} />
            <span className="text-sm font-bold text-slate-100">Ajouter le shiny choisi à ma collection</span>
          </label>
        </div>
        <PokemonPicker onPick={done} autoFocus={false} placeholder="Quel shiny est apparu ?" />
      </div>
    </Sheet>
  );
}

function EditHuntSheet({ open, onClose, hunt, elapsed }) {
  const { updateHunt, deleteHunt, setElapsed } = useStore();
  const confirm = useConfirm();
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (open) {
      const mins = Math.floor(elapsed / 60000);
      setForm({ game: hunt.game, method: hunt.method, opts: hunt.opts || {}, charm: hunt.charm, customOdds: hunt.customOdds, step: hunt.step, count: hunt.count, hours: Math.floor(mins / 60), minutes: mins % 60, notes: hunt.notes || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!form) return null;
  const set = patch => setForm(f => ({ ...f, ...patch }));
  const save = () => {
    updateHunt(hunt.id, { game: form.game, method: form.method, opts: form.opts, charm: form.charm, customOdds: form.customOdds || null, step: Math.max(1, form.step), count: Math.max(0, form.count), notes: form.notes }, 'Chasse modifiée');
    const newMs = (form.hours * 60 + form.minutes) * 60000;
    if (Math.abs(newMs - Math.floor(elapsed / 60000) * 60000) >= 60000) setElapsed(hunt.id, newMs);
    onClose();
  };
  const remove = async () => {
    const ok = await confirm({ title: 'Supprimer cette chasse ?', message: `Le compteur (${fmtNumber(huntTotal(hunt))}) et le chrono seront supprimés. Tu pourras annuler juste après.`, confirmLabel: 'Supprimer', danger: true });
    if (ok) { onClose(); deleteHunt(hunt.id); }
  };
  const reset = async () => {
    const ok = await confirm({ title: 'Remettre à zéro ?', message: 'Le compteur, les phases et le chronomètre repartent de zéro.', confirmLabel: 'Remettre à zéro', danger: true });
    if (ok) { updateHunt(hunt.id, { count: 0, phases: [], elapsedMs: 0, startedAt: null }, 'Chasse remise à zéro'); onClose(); }
  };
  const num = (key, min = 0) => e => set({ [key]: Math.max(min, parseInt(e.target.value, 10) || 0) });
  return (
    <Sheet open={open} onClose={onClose} title="Paramètres de la chasse" icon={<Settings2 className="w-5 h-5" />}
      footer={<div className="flex gap-3"><button className="btn-secondary flex-1" onClick={onClose}>Annuler</button><button className="btn-primary flex-1" onClick={save}>Enregistrer</button></div>}>
      <div className="space-y-4">
        <OddsConfig value={form} onChange={set} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pas"><input type="number" inputMode="numeric" className="input font-mono" value={form.step} onChange={num('step', 1)} /></Field>
          <Field label="Compteur"><input type="number" inputMode="numeric" className="input font-mono" value={form.count} onChange={num('count')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Heures"><input type="number" inputMode="numeric" className="input font-mono" value={form.hours} onChange={num('hours')} /></Field>
          <Field label="Minutes"><input type="number" inputMode="numeric" className="input font-mono" value={form.minutes} onChange={e => set({ minutes: Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)) })} /></Field>
        </div>
        <Field label="Notes"><textarea className="input py-3 min-h-20" value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="Lieu, sandwich utilisé…" /></Field>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button className="btn-secondary" onClick={reset}><RotateCcw className="w-4 h-4" /> Remettre à 0</button>
          <button className="btn-secondary text-rose-300" onClick={remove}><Trash2 className="w-4 h-4" /> Supprimer</button>
        </div>
      </div>
    </Sheet>
  );
}

function HistorySheet({ open, onClose, hunts }) {
  const { resumeHunt, deleteHunt } = useStore();
  return (
    <Sheet open={open} onClose={onClose} title="Chasses terminées" icon={<History className="w-5 h-5" />}>
      <div className="space-y-2">
        {hunts.map(h => {
          const p = getPokemon(h.targetId);
          const total = huntTotal(h);
          const luck = getLuckTier(total > 0 ? luckRatio(huntChance(h)) : null);
          return (
            <div key={h.id} className="flex items-center gap-3 p-2 pr-1 rounded-2xl bg-slate-950 border border-slate-800">
              <Sprite pokemon={p} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-100 truncate">{p?.name} <span title={luck.name}>{luck.emoji}</span></div>
                <div className="text-xs text-slate-500 truncate">{fmtNumber(total)} · {formatDuration(h.elapsedMs, { short: true })} · {formatDate(isoFromTimestamp(h.finishedAt))}</div>
              </div>
              <button className="icon-btn text-slate-400" aria-label="Reprendre" onClick={() => { resumeHunt(h.id); onClose(); }}><RotateCcw className="w-4 h-4" /></button>
              <button className="icon-btn text-slate-500" aria-label="Supprimer" onClick={() => deleteHunt(h.id)}><Trash2 className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
