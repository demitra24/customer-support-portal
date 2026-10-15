import { useEffect, useState } from 'react';
import api from '../api';
import { fmtDate, fmtHours } from '../utils';
import Icon from '../components/Icon';

const SectionHead = ({ title, sub }) => (
  <div className="flex items-baseline justify-between">
    <h2 className="font-display text-lg font-bold">{title}</h2>
    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-mute">{sub}</span>
  </div>
);

export default function Team() {
  const [ov, setOv] = useState(null);
  const [cust, setCust] = useState(null);
  useEffect(() => {
    api.get('/analytics/overview').then((r) => setOv(r.data));
    api.get('/users/customers').then((r) => setCust(r.data.customers));
  }, []);

  if (!ov || !cust)
    return <div className="py-10 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">Loading roster…</div>;

  const agentMax = Math.max(...ov.agents.map((a) => a.resolved), 1);

  return (
    <div className="rise">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Team</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-mute">
          {ov.agents.length} on the pod · {cust.length} customers · live workload
        </p>
      </div>

      <SectionHead title="Support pod" sub="resolved · speed · satisfaction" />
      <div className="mt-4">
        {ov.agents.map((a, i) => (
          <div key={a.id} className="mb-1 grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-transparent px-3 py-3.5 transition-colors hover:bg-panel md:grid-cols-[2rem_minmax(0,1fr)_8rem_6rem_5rem_6rem]">
            <span className="font-display font-bold text-mute">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
              <div className="truncate font-medium">{a.name}</div>
              <div className="mt-1.5 h-1 max-w-[220px] rounded-full bg-line">
                <div className="h-full rounded-full bg-gradient-to-r from-iris to-cobalt" style={{ width: `${(a.resolved / agentMax) * 100}%` }} />
              </div>
            </div>
            <div className="hidden font-display font-bold md:block">{a.resolved}<span className="ml-1 text-xs font-normal text-mute">resolved</span></div>
            <div className="hidden font-mono text-xs text-mute md:block">{fmtHours(a.avgHours)}</div>
            <div className="hidden items-center gap-1 font-mono text-xs md:flex">
              <Icon name="star" className="h-3.5 w-3.5 text-amber2" filled />{a.csat ? a.csat.toFixed(1) : '—'}
            </div>
            <div className="hidden text-right font-mono text-xs text-mute md:block">{a.open} open</div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <SectionHead title="Customers" sub={`${cust.length} registered`} />
        <div className="mt-4">
          {cust.map((c) => (
            <div key={c._id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-3 md:grid-cols-[minmax(0,1fr)_10rem_5rem_7rem]">
              <div className="min-w-0">
                <div className="truncate font-medium">{c.name}</div>
                <div className="truncate font-mono text-[11px] text-mute">{c.email}</div>
              </div>
              <div className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-mute md:block">{fmtDate(c.createdAt)}</div>
              <div className="hidden font-display font-bold md:block">{c.total}<span className="ml-1 text-xs font-normal text-mute">filed</span></div>
              <div className={`text-right font-mono text-xs ${c.open > 0 ? 'text-amber2' : 'text-mute'}`}>{c.open} open</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}