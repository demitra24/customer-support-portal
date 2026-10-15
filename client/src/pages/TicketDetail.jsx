import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../components/toast';
import { StatusBadge, PriorityBadge, CatChip, Stamp, STATUS, PRIORITY, SEV } from '../components/bits';
import { fmtTime, fmtDate, fmtHours, timeAgo, tid } from '../utils';
import Icon from '../components/Icon';

function Msg({ role, authorName, body, at, kind }) {
  if (kind === 'system')
    return (
      <div className="my-5 flex items-center gap-3">
        <span className="flex-1 border-t border-line" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-mute">{body}</span>
        <span className="flex-1 border-t border-line" />
      </div>
    );
  const staff = role === 'agent' || role === 'admin';
  return (
    <div className={`mb-4 ${staff ? 'ml-10' : ''}`}>
      <div className={`px-4 py-3 text-sm leading-relaxed ${staff
        ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-iris to-cobalt text-white shadow-glow-sm'
        : 'rounded-2xl rounded-bl-md border border-line bg-panel2'}`}>{body}</div>
      <div className={`mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute ${staff ? 'justify-end' : ''}`}>
        <span>{authorName}</span><span className="text-line">·</span>
        <span>{staff ? 'agent' : 'customer'}</span><span className="text-line">·</span>
        <span>{fmtTime(at)}</span>
      </div>
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [t, setT] = useState(null);
  const [err, setErr] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [sugs, setSugs] = useState(null);
  const [agents, setAgents] = useState([]);
  const [hoverN, setHoverN] = useState(0);
  const isStaff = ['agent', 'admin'].includes(user.role);

  const load = () =>
    api.get(`/tickets/${id}`).then((r) => { setT(r.data.ticket); setErr(''); }).catch((e) => setErr(errMsg(e)));

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [id]);

  useEffect(() => {
    if (isStaff) api.get('/users/agents').then((r) => setAgents(r.data.agents));
  }, []);

  const refreshSugs = () => api.get(`/tickets/${id}/suggestions`).then((r) => setSugs(r.data)).catch(() => {});
  useEffect(() => { if (isStaff && t) refreshSugs(); }, [id, isStaff, t?.updatedAt]);

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const r = await api.post(`/tickets/${id}/replies`, { body: reply });
      setT(r.data.ticket);
      setReply('');
      toast.push('Reply sent');
    } catch (e2) { toast.push(errMsg(e2), 'signal'); }
    finally { setBusy(false); }
  };
  const patch = async (fields, msg) => {
    try { const r = await api.patch(`/tickets/${id}`, fields); setT(r.data.ticket); if (msg) toast.push(msg); }
    catch (e) { toast.push(errMsg(e), 'signal'); }
  };
  const escalate = async () => {
    try { const r = await api.patch(`/tickets/${id}/escalate`); setT(r.data.ticket); toast.push('Escalated — moved to the priority lane', 'signal'); }
    catch (e) { toast.push(errMsg(e), 'signal'); }
  };
  const rate = async (rating) => {
    try { const r = await api.post(`/tickets/${id}/rate`, { rating }); setT(r.data.ticket); toast.push('Thanks for the rating'); }
    catch (e) { toast.push(errMsg(e), 'signal'); }
  };

  if (err) return <div className="rounded-lg border border-signal/40 bg-signalsoft px-4 py-3 text-sm text-signal">{err}</div>;
  if (!t) return <div className="py-10 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">Pulling ticket…</div>;

  const owner = t.customer;

  return (
    <div className="rise">
      <button onClick={() => nav(-1)} className="mb-5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-mute transition-colors hover:text-iris">
        <Icon name="chevronLeft" className="h-3.5 w-3.5" />{isStaff ? 'Queue' : 'My tickets'}
      </button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] text-mute">{tid(t._id)}</span>
            <StatusBadge s={t.status} /><PriorityBadge p={t.priority} /><CatChip c={t.category} />
            {t.status === 'escalated' && <Stamp />}
          </div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{t.subject}</h1>
          <p className="mt-2 text-sm text-mute">
            Filed by <span className="font-medium text-ink">{owner.name}</span> ({owner.email}) · {fmtTime(t.createdAt)}
          </p>
        </div>
        {t.triage && (
          <div className="shrink-0 rounded-xl border border-line bg-panel px-4 py-3 text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Engine confidence</div>
            <div className="font-display text-2xl font-bold text-iris">{Math.round(t.triage.confidence * 100)}%</div>
          </div>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <Msg role="customer" authorName={owner.name} body={t.description} at={t.createdAt} />
          {t.replies.map((m, i) => <Msg key={i} {...m} />)}
          <form onSubmit={send} className="mt-8">
            <label className="label">{isStaff ? 'Reply as agent' : 'Add a reply'}</label>
            <textarea rows={4} className="input resize-none" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your reply…" />
            <div className="mt-3 flex justify-end">
              <button disabled={busy || !reply.trim()} className="btn-primary">
                <Icon name="send" className="h-4 w-4" />{busy ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          {isStaff ? (
            <>
              <div className="card p-5">
                <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Control</div>
                <div className="label">Status</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.keys(STATUS).map((s) => (
                    <button key={s} onClick={() => patch({ status: s }, `Status → ${STATUS[s].label}`)}
                      className={`rounded-lg border px-2 py-1.5 text-xs transition-all ${t.status === s ? STATUS[s].cls + ' font-medium' : 'border-line text-mute hover:border-iris/60 hover:text-ink'}`}>
                      {STATUS[s].label}
                    </button>
                  ))}
                </div>
                <div className="label mt-4">Priority</div>
                <select className="input text-sm" value={t.priority} onChange={(e) => patch({ priority: e.target.value }, 'Priority updated')}>
                  {Object.keys(PRIORITY).map((p) => <option key={p} value={p}>{PRIORITY[p].label}</option>)}
                </select>
                <div className="label mt-4">Assignee</div>
                <select className="input text-sm" value={t.assignee?._id || ''} onChange={(e) => patch({ assignee: e.target.value || null }, 'Assignment updated')}>
                  <option value="">Unassigned</option>
                  {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
                {t.status !== 'escalated' && t.status !== 'resolved' && (
                  <button onClick={escalate}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-signal/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-signal transition-all hover:bg-signal hover:text-white">
                    <Icon name="arrowUpRight" className="h-3.5 w-3.5" />Escalate ticket
                  </button>
                )}
                {t.triage?.suggestedPriority && SEV[t.triage.suggestedPriority] > SEV[t.priority] && (
                  <div className="mt-4 rounded-lg border border-amber2/40 bg-ambersoft px-3 py-2.5 text-xs leading-relaxed">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-amber2">Engine disagrees</span>
                    Filed text reads as <b>{PRIORITY[t.triage.suggestedPriority].label.toLowerCase()}</b> priority.
                    <button onClick={() => patch({ priority: t.triage.suggestedPriority }, 'Engine priority accepted')} className="ml-1 underline underline-offset-2">Accept</button>
                  </div>
                )}
                {t.triage?.keywords?.length > 0 && (
                  <div className="mt-4">
                    <div className="label">Matched signals</div>
                    <div className="flex flex-wrap gap-1">
                      {t.triage.keywords.map((k) => <span key={k} className="rounded-md border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[10px]">{k}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Suggested replies</div>
                  <button onClick={refreshSugs} className="text-mute transition-colors hover:text-iris" title="Re-run engine">
                    <Icon name="refresh" className="h-3.5 w-3.5" />
                  </button>
                </div>
                {!sugs && <div className="font-mono text-[11px] text-mute">Reading thread…</div>}
                {sugs && (
                  <>
                    <div className="mb-3 font-mono text-[10px] text-mute">based on {sugs.basedOn} · {sugs.engine.category}/{sugs.engine.priority}</div>
                    <div className="space-y-2">
                      {sugs.suggestions.map((s, i) => (
                        <button key={i} onClick={() => setReply(s.body)} className="group w-full rounded-lg border border-line bg-panel2 p-3 text-left transition-all hover:border-iris/60">
                          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-mute group-hover:text-iris">{s.title}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-ink/80">{s.body}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {t.status === 'resolved' && (
                <div className="card p-5">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">How did we do?</div>
                  {t.rating ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Icon key={n} name="star" filled={n <= t.rating} className={`h-5 w-5 ${n <= t.rating ? 'text-amber2' : 'text-line'}`} />
                      ))}
                      <span className="ml-2 font-mono text-[11px] text-mute">your rating</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2" onMouseLeave={() => setHoverN(0)}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => rate(n)} onMouseEnter={() => setHoverN(n)}
                          className={`transition-colors ${n <= hoverN ? 'text-amber2' : 'text-line hover:text-amber2'}`}>
                          <Icon name="star" filled={n <= hoverN} className="h-6 w-6" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {t.status !== 'resolved' && t.status !== 'escalated' && (
                <div className="card p-5">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Need more attention?</div>
                  <p className="mb-3 text-xs leading-relaxed text-mute">Escalating moves this ticket into the priority lane and flags it to the duty lead.</p>
                  <button onClick={escalate} className="w-full rounded-lg border border-signal/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-signal transition-all hover:bg-signal hover:text-white">
                    Escalate ticket
                  </button>
                </div>
              )}
              <div className="card space-y-2 p-5 font-mono text-[11px] text-mute">
                <div className="flex justify-between"><span>FILED</span><span className="text-ink">{fmtDate(t.createdAt)}</span></div>
                <div className="flex justify-between"><span>LAST ACTIVITY</span><span className="text-ink">{timeAgo(t.updatedAt)}</span></div>
                <div className="flex justify-between"><span>REPLIES</span><span className="text-ink">{t.replies.filter((r) => r.kind !== 'system').length}</span></div>
                {t.resolvedAt && (
                  <div className="flex justify-between">
                    <span>RESOLVED IN</span>
                    <span className="text-ink">{fmtHours((new Date(t.resolvedAt) - new Date(t.createdAt)) / 3600000)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}