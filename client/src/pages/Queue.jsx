import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { StatusBadge, PriorityBadge, CatChip, Stamp } from '../components/bits';
import { timeAgo, tid } from '../utils';
import Icon from '../components/Icon';

const SPINE = { urgent: 'bg-signal', high: 'bg-amber2', medium: 'bg-iris', low: 'bg-line' };
const STATUSES = ['all', 'open', 'in_progress', 'escalated', 'resolved'];

export default function Queue() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [scope, setScope] = useState(params.get('scope') || (user.role === 'agent' ? 'mine' : 'all'));
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [tickets, setTickets] = useState(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      api.get('/tickets', { params: { scope, status, q } })
        .then((r) => { if (live) setTickets(r.data.tickets); });
    }, q ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [scope, status, q]);

  const tab = (active) =>
    `rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${active ? 'border-transparent bg-iris text-white shadow-glow-sm' : 'border-line text-mute hover:border-mute/50 hover:text-ink'}`;

  return (
    <div className="rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{user.role === 'admin' && scope === 'all' ? 'All tickets' : 'Queue'}</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-mute">
            {tickets ? `${tickets.length} in view` : 'Loading…'}
          </p>
        </div>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject, text, requester…"
            className="input w-64 pl-9" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {user.role !== 'customer' && (
          <>
            <button onClick={() => setScope('mine')} className={tab(scope === 'mine')}>Mine</button>
            <button onClick={() => setScope('all')} className={tab(scope === 'all')}>Everyone</button>
            <button onClick={() => setScope('unassigned')} className={tab(scope === 'unassigned')}>Unassigned</button>
            <span className="mx-1 h-5 w-px bg-line" />
          </>
        )}
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={tab(status === s)}>
            {s === 'all' ? 'Any status' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {tickets && tickets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line py-14 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
          Nothing matches this view
        </div>
      )}

      {tickets && tickets.map((t) => (
        <Link key={t._id} to={`/tickets/${t._id}`}
          className="group mb-1 grid grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-transparent px-3 py-3.5 transition-all hover:border-line hover:bg-panel md:grid-cols-[4px_minmax(0,2fr)_minmax(0,1fr)_auto]">
          <span className={`h-9 w-[3px] rounded-full ${SPINE[t.priority] || 'bg-line'}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium transition-colors group-hover:text-iris">{t.subject}</span>
              {t.status === 'escalated' && <Stamp />}
            </div>
            <div className="mt-1 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
              <span>{tid(t._id)}</span><CatChip c={t.category} />
              <span className="hidden sm:inline">{timeAgo(t.createdAt)}</span>
            </div>
          </div>
          <div className="hidden text-sm md:block">
            <div className="truncate">{t.customer?.name}</div>
            <div className={`truncate text-xs ${t.assignee ? 'text-mute' : 'font-medium text-iris'}`}>
              {t.assignee ? `→ ${t.assignee.name}` : 'Unassigned'}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <PriorityBadge p={t.priority} />
            <StatusBadge s={t.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}