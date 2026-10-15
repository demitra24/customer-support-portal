import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { StatusBadge, CatChip, Stamp, Empty } from '../components/bits';
import { timeAgo, tid } from '../utils';
import Icon from '../components/Icon';

const SPINE = { escalated: 'bg-signal', in_progress: 'bg-teal2', resolved: 'bg-moss', open: 'bg-amber2' };

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(null);
  useEffect(() => { api.get('/tickets').then((r) => setTickets(r.data.tickets)); }, []);

  const open = tickets ? tickets.filter((t) => t.status !== 'resolved').length : 0;

  return (
    <div className="rise">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Your tickets</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-mute">
            Hi {user.name.split(' ')[0]} — {open} in flight · {Math.max(0, (tickets?.length || 0) - open)} resolved
          </p>
        </div>
        <Link to="/new" className="btn-primary">
          <Icon name="plus" className="h-4 w-4" />File a new ticket
        </Link>
      </div>

      {!tickets && <div className="py-10 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">Loading…</div>}

      {tickets && tickets.length === 0 && (
        <Empty title="Nothing on file yet" sub="When something goes wrong, this is where you'll track it — replies, status and resolution.">
          <Link to="/new" className="btn-primary"><Icon name="plus" className="h-4 w-4" />File your first ticket</Link>
        </Empty>
      )}

      {tickets && tickets.map((t) => (
        <Link key={t._id} to={`/tickets/${t._id}`}
          className="group mb-1 flex items-center gap-4 rounded-xl border border-transparent px-3 py-4 transition-all hover:border-line hover:bg-panel">
          <span className={`w-[3px] self-stretch rounded-full ${SPINE[t.status]}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="truncate font-medium transition-colors group-hover:text-iris">{t.subject}</span>
              {t.status === 'escalated' && <Stamp />}
            </div>
            <div className="mt-1 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
              <span>{tid(t._id)}</span><CatChip c={t.category} />
              <span className="flex items-center gap-1"><Icon name="message" className="h-3 w-3" />{t.replies.filter((r) => r.kind !== 'system').length}</span>
            </div>
          </div>
          <div className="shrink-0 space-y-1 text-right">
            <StatusBadge s={t.status} />
            <div className="font-mono text-[10px] text-mute">{timeAgo(t.updatedAt)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}