import { useState } from 'react';
import { ListPlus, Trash2, Check } from 'lucide-react';
import { useActions, useAppState } from '../../state/StoreProvider.jsx';
import { Sheet } from '../../ui/index.js';

export const LIST_EMOJIS = ['📌', '⭐', '❤️', '🔥', '💎', '🎯', '🏆', '🌙', '🌊', '🌿', '⚡', '👻', '🐉', '🍇', '🗼', '🎮'];

export function NewListForm({ onCreated, autoFocus = false }) {
  const { createList } = useActions();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📌');
  const submit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = createList({ name, emoji });
    setName('');
    onCreated?.(id);
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input className="input flex-1" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la liste (ex. « À faire en Z-A »)" maxLength={40} autoFocus={autoFocus} enterKeyHint="done" />
        <button type="submit" className="btn-primary px-4" disabled={!name.trim()} aria-label="Créer la liste"><ListPlus className="w-5 h-5" /></button>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {LIST_EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => setEmoji(e)} aria-pressed={emoji === e}
            className={`shrink-0 w-10 h-10 rounded-xl text-lg border ${emoji === e ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-950 border-slate-800'}`}>{e}</button>
        ))}
      </div>
    </form>
  );
}

export default function ListsSheet({ open, onClose }) {
  const { lists, wishCount } = useAppState(s => ({ lists: s.lists, wishCount: Object.keys(s.wishlist).length }));
  const { updateList, deleteList } = useActions();
  const [editing, setEditing] = useState(null);
  return (
    <Sheet open={open} onClose={onClose} title="Mes listes" subtitle="Regroupe tes Pokémon comme tu veux" icon={<ListPlus className="w-5 h-5" />}>
      <div className="space-y-5">
        <NewListForm />
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xl">⭐</span>
            <span className="flex-1 text-sm font-bold text-slate-100">Objectifs</span>
            <span className="text-xs font-mono text-slate-500">{wishCount}</span>
          </div>
          {lists.map(l => (
            <div key={l.id} className="flex items-center gap-2 p-2 pl-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xl">{l.emoji}</span>
              {editing === l.id ? (
                <input className="input min-h-10 flex-1" defaultValue={l.name} autoFocus maxLength={40}
                  onBlur={e => { updateList(l.id, { name: e.target.value.trim() || l.name }); setEditing(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
              ) : (
                <button className="flex-1 text-left text-sm font-bold text-slate-100 truncate min-h-10" onClick={() => setEditing(l.id)}>{l.name}</button>
              )}
              <span className="text-xs font-mono text-slate-500">{Object.keys(l.keys).length}</span>
              {editing === l.id
                ? <span className="icon-btn text-emerald-400"><Check className="w-4 h-4" /></span>
                : <button className="icon-btn text-slate-500" aria-label={`Supprimer ${l.name}`} onClick={() => deleteList(l.id)}><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
          {lists.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Aucune liste perso pour l'instant.</p>}
        </div>
      </div>
    </Sheet>
  );
}
