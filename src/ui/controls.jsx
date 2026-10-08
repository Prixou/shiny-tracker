// Contrôles de formulaire et états vides.
export function Segmented({ options, value, onChange, size = 'md', className = '' }) {
  return (
    <div className={`flex bg-slate-950/80 border border-slate-800 rounded-2xl p-1 gap-1 ${className}`} role="tablist">
      {options.map(o => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors ${size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} ${
              active ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 active:bg-slate-800'
            }`}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
            {o.badge != null && <span className={`text-[10px] font-mono ${active ? 'text-slate-900/70' : 'text-slate-500'}`}>{o.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, desc, icon }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 py-3 text-left"
    >
      {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-slate-100">{label}</span>
        {desc && <span className="block text-xs text-slate-400 mt-0.5">{desc}</span>}
      </span>
      <span className={`shrink-0 w-12 h-7 rounded-full p-1 transition-colors ${checked ? 'bg-amber-500' : 'bg-slate-700'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

export const Field = ({ label, children, hint, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-xs font-bold text-slate-400 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
  </label>
);

export const EmptyState = ({ icon, title, children, action }) => (
  <div className="flex flex-col items-center text-center py-14 px-6 gap-3">
    <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">{icon}</div>
    <h3 className="text-base font-black text-slate-200">{title}</h3>
    {children && <p className="text-sm text-slate-400 max-w-xs">{children}</p>}
    {action}
  </div>
);
