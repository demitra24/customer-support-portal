import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { AreaChart, Donut, Gauge, Spark } from '../components/charts';
import { fmtHours } from '../utils';
import Icon from '../components/Icon';

const CAT_COLORS = ['#7C6CFF', '#4CC9F0', '#FF5470', '#FFC24B', '#3DDC97', '#8B93A7'];

const SectionHead = ({ title, sub }) => (
  <div className="flex items-baseline justify-between">
    <h2 className="font-display text-lg font-bold">{title}</h2>
    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-mute">{sub}</span>
  </div>
);

export default function Overview() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => {
    const load = () => api.get('/analytics/overview').then((r) => setD(r.data));
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  if (!d) return <div className="py-10 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">Compiling briefing…</div>;

  const { totals, volume, avgResolutionHours, csat, categories, agents, trend } = d;
  const delta = trend.lastWeek ? Math.round(((trend.thisWeek - trend.lastWeek) / trend.lastWeek) * 100) : null;
  const agentMax = Math.max(...agents.map((a) => a.resolved), 1);
  const donutItems = [
    { label: 'Open', value: totals.open, color: '#FFC24B' },
    { label: 'In progress', value: totals.in_progress, color: '#4CC9F0' },
    { label: 'Escalated', value: totals.escalated, color: '#FF5470' },
    { label: 'Resolved', value: totals.resolved, color: '#3DDC97' },
  ];

  return (
    <div className="rise">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Ops briefing</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-mute">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · live from MongoDB · auto-refresh 30s
        </p>
      </div>

      <div className="grid items-start gap-8 border-t border-line pb-10 pt-6 md:grid-cols-[1.2fr_1fr_auto]">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Active queue</div>
          <div className="mt-2 bg-gradient-to-r from-iris via-cobalt to-teal2 bg-clip-text font-display text-7xl font-extrabold leading-none text-transparent md:text-8xl">{totals.active}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${delta != null && delta < 0 ? 'bg-mosssoft text-moss' : 'bg-ambersoft text-amber2'}`}>
              <Icon name={delta != null && delta < 0 ? 'arrowDown' : 'arrowUp'} className="h-3.5 w-3.5" />
              {delta == null ? `${trend.thisWeek} filed` : `${Math.abs(delta)}% vs last week`}
            </span>
            <span className="text-mute">· {trend.thisWeek} this week, {trend.lastWeek} prior</span>
          </div>
          <div className="mt-4"><Spark points={volume.map((v) => v.created)} /></div>
        </div>

        <div className="grid grid-cols-2 gap-6 md:border-l md:border-line md:pl-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Avg resolution</div>
            <div className="mt-1 font-display text-4xl font-bold">{avgResolutionHours ? fmtHours(avgResolutionHours) : '—'}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Unassigned</div>
            <div className="mt-1 font-display text-4xl font-bold">{totals.unassigned}</div>
            <Link to="/queue?scope=unassigned" className="mt-1 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-iris underline underline-offset-2">pick up</Link>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Resolved all-time</div>
            <div className="mt-1 font-display text-4xl font-bold">{totals.resolved}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Total tickets</div>
            <div className="mt-1 font-display text-4xl font-bold">{totals.total}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Gauge value={csat.avg} />
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">CSAT · {csat.count} ratings</div>
        </div>
      </div>

      <div className="grid gap-10 border-t border-line pb-10 pt-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <SectionHead title="Ticket volume" sub="created vs resolved · last 14 days" />
          <div className="mt-5">
            <AreaChart data={volume}
              series={[{ key: 'created', label: 'Created', color: '#7C6CFF' }, { key: 'resolved', label: 'Resolved', color: '#3DDC97' }]} />
          </div>
        </div>
        <div>
          <SectionHead title="Status mix" sub="all tickets" />
          <div className="mt-5 flex items-center gap-6">
            <Donut items={donutItems} centerLabel={totals.total} centerSub="tickets" />
            <div className="flex-1 space-y-2.5 text-sm">
              {donutItems.map((i) => (
                <div key={i.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
                  <span className="flex-1">{i.label}</span>
                  <span className="font-mono text-xs text-mute">{i.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line pb-10 pt-8">
        <SectionHead title="What people write about" sub="engine classification" />
        <div className="mb-5 mt-6 flex h-2 gap-1">
          {categories.map((c, i) => (
            <div key={c.name} title={`${c.name}: ${c.count}`} className="rounded-full"
              style={{ width: `${(c.count / totals.total) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
          ))}
        </div>
        <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3 text-sm">
              <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
              <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.12em]">{c.name}</span>
              <span className="text-xs text-mute">{Math.round((c.count / totals.total) * 100)}%</span>
              <span className="font-display font-bold">{c.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-8">
        <SectionHead title="Agent performance" sub="resolved · speed · satisfaction" />
        <div className="mt-5">
          {agents.map((a, i) => (
            <div key={a.id}
              className={`mb-1 grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border px-3 py-3.5 transition-colors md:grid-cols-[2rem_minmax(0,1fr)_8rem_6rem_5rem_6rem] ${a.id === user.id ? 'border-iris/30 bg-irissoft/60' : 'border-transparent hover:bg-panel'}`}>
              <span className="font-display font-bold text-mute">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {a.name}
                  {a.id === user.id && <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-iris">you</span>}
                </div>
                <div className="mt-1.5 h-1 max-w-[220px] rounded-full bg-line">
                  <div className="h-full rounded-full bg-gradient-to-r from-iris to-cobalt" style={{ width: `${(a.resolved / agentMax) * 100}%` }} />
                </div>
              </div>
              <div className="hidden font-display font-bold md:block">
                {a.resolved}<span className="ml-1 text-xs font-normal text-mute">resolved</span>
              </div>
              <div className="hidden font-mono text-xs text-mute md:block">{fmtHours(a.avgHours)}</div>
              <div className="hidden items-center gap-1 font-mono text-xs md:flex">
                <Icon name="star" className="h-3.5 w-3.5 text-amber2" filled />{a.csat ? a.csat.toFixed(1) : '—'}
              </div>
              <div className="hidden text-right font-mono text-xs text-mute md:block">{a.open} open</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}