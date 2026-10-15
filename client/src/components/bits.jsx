export const STATUS = {
  open: { label: 'Open', cls: 'bg-ambersoft text-amber2 border-amber2/30' },
  in_progress: { label: 'In progress', cls: 'bg-tealsoft text-teal2 border-teal2/30' },
  escalated: { label: 'Escalated', cls: 'bg-signalsoft text-signal border-signal/40' },
  resolved: { label: 'Resolved', cls: 'bg-mosssoft text-moss border-moss/30' },
};
export const PRIORITY = {
  low: { label: 'Low', cls: 'text-mute border-line' },
  medium: { label: 'Medium', cls: 'text-ink border-line' },
  high: { label: 'High', cls: 'text-amber2 border-amber2/50' },
  urgent: { label: 'Urgent', cls: 'text-signal border-signal/60' },
};
export const SEV = { low: 0, medium: 1, high: 2, urgent: 3 };

export const StatusBadge = ({ s }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${STATUS[s]?.cls || 'border-line text-mute'}`}>
    {STATUS[s]?.label || s}
  </span>
);

export const PriorityBadge = ({ p }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border bg-panel2 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${PRIORITY[p]?.cls || ''}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${p === 'urgent' ? 'bg-signal' : p === 'high' ? 'bg-amber2' : p === 'medium' ? 'bg-mute' : 'bg-line'}`} />
    {PRIORITY[p]?.label || p}
  </span>
);

export const Stamp = ({ text = 'Escalated' }) => (
  <span className="inline-block -rotate-2 select-none rounded-md border border-signal/60 bg-signalsoft px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.22em] text-signal">
    {text}
  </span>
);

export const CatChip = ({ c }) => (
  <span className="rounded-md border border-line bg-panel2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{c}</span>
);

export const Empty = ({ title, sub, children }) => (
  <div className="rounded-2xl border border-dashed border-line py-14 text-center">
    <div className="font-display text-2xl font-bold">{title}</div>
    {sub && <p className="mt-2 text-sm text-mute">{sub}</p>}
    {children && <div className="mt-5">{children}</div>}
  </div>
);