import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useToast } from '../components/toast';
import { PriorityBadge } from '../components/bits';
import Icon from '../components/Icon';

export default function NewTicket() {
  const toast = useToast();
  const nav = useNavigate();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [triage, setTriage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subject.trim().length + description.trim().length < 4) { setTriage(null); setScanning(false); return; }
    setScanning(true);
    const t = setTimeout(() => {
      api.post('/tickets/classify', { subject, description })
        .then((r) => { setTriage(r.data); setScanning(false); })
        .catch(() => setScanning(false));
    }, 500);
    return () => clearTimeout(t);
  }, [subject, description]);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) { setError('Subject and description are both required.'); return; }
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/tickets', { subject, description });
      toast.push(`Filed — engine read it as ${r.data.ticket.category} · ${r.data.ticket.priority}`);
      nav(`/tickets/${r.data.ticket._id}`);
    } catch (e2) {
      setError(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rise grid gap-10 lg:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="card space-y-5 p-6 md:p-8">
        <div>
          <h1 className="font-display text-3xl font-bold">File a ticket</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-mute">The more concrete, the faster the fix</p>
        </div>
        <div>
          <label className="label">Subject</label>
          <input className="input font-medium" maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="One line — what went wrong?" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={11} className="input resize-none leading-relaxed" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened, what did you expect, what did you try? Include order numbers, error text, timestamps — anything concrete." />
        </div>
        {error && <div className="rounded-lg border border-signal/40 bg-signalsoft px-3 py-2 text-sm text-signal">{error}</div>}
        <button disabled={busy} className="btn-primary w-full">
          <Icon name="send" className="h-4 w-4" />{busy ? 'Filing…' : 'File ticket'}
        </button>
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Live triage</span>
            <span className={`h-2 w-2 rounded-full ${scanning ? 'animate-pulse bg-iris' : triage ? 'bg-moss' : 'bg-line'}`} />
          </div>
          <div className="relative overflow-hidden">
            {scanning && <div className="scanline absolute bottom-0 top-0 w-1/3 bg-gradient-to-r from-transparent via-iris/20 to-transparent" />}
            <div className="min-h-[300px] space-y-4 p-5">
              {!triage && (
                <p className="text-sm leading-relaxed text-mute">
                  Start describing the issue — the engine reads as you type and predicts category, priority and sentiment before you hit send.
                </p>
              )}
              {triage && (
                <>
                  <div>
                    <div className="label">Category</div>
                    <div className="font-display text-2xl font-bold capitalize">{triage.category}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-line">
                      <div className="h-full rounded-full bg-gradient-to-r from-iris to-cobalt transition-all duration-500" style={{ width: `${triage.confidence * 100}%` }} />
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-mute">{Math.round(triage.confidence * 100)}% confidence</div>
                  </div>
                  <div>
                    <div className="label">Predicted priority</div>
                    <PriorityBadge p={triage.priority} />
                  </div>
                  <div>
                    <div className="label">Sentiment</div>
                    <div className={`font-display font-bold capitalize ${triage.sentiment === 'negative' ? 'text-signal' : triage.sentiment === 'positive' ? 'text-moss' : ''}`}>
                      {triage.sentiment}
                    </div>
                  </div>
                  {triage.keywords.length > 0 && (
                    <div>
                      <div className="label">Matched signals</div>
                      <div className="flex flex-wrap gap-1">
                        {triage.keywords.map((k) => (
                          <span key={k} className="rounded-md border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-ink">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="border-t border-line px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-mute">
            Rules engine v1 · runs again on ingest
          </div>
        </div>
      </aside>
    </div>
  );
}