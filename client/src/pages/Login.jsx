import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { homeFor } from '../App';
import { errMsg } from '../api';

const DEMOS = [
  { role: 'Admin', chip: 'bg-irissoft text-iris', name: 'Priya Raman', email: 'priya@relay.io', password: 'admin123' },
  { role: 'Agent', chip: 'bg-tealsoft text-teal2', name: 'Dana Whitfield', email: 'dana@relay.io', password: 'agent123' },
  { role: 'Customer', chip: 'bg-ambersoft text-amber2', name: 'Sam Ortiz', email: 'sam@relay.io', password: 'customer123' },
];

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav(homeFor(user.role), { replace: true }); }, [user]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 dotgrid" />
        <div className="floaty absolute -top-24 right-10 h-80 w-80 rounded-full bg-iris/20 blur-3xl" />
        <div className="floaty-slow absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-cobalt/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-iris to-cobalt font-display text-lg font-extrabold text-white shadow-glow-sm">R</div>
            <div>
              <div className="font-display text-xl font-bold tracking-tight">RELAY</div>
              <div className="font-mono text-[8px] uppercase tracking-[0.28em] text-mute">Customer Support Intelligence Portal</div>
            </div>
          </div>
        </div>
        <div className="relative max-w-lg">
          <h1 className="font-display text-5xl font-extrabold leading-[1.06]">
            Every ticket,{' '}
            <span className="bg-gradient-to-r from-iris via-cobalt to-teal2 bg-clip-text text-transparent">triaged</span>{' '}
            before you finish typing.
          </h1>
          <div className="mt-10 space-y-4">
            {[
              ['01', 'Live triage', 'A rules engine reads every word as it is typed — category, priority and sentiment before the ticket is even filed.'],
              ['02', 'Escalation lane', 'Urgent work rises on its own. Nothing time-critical sits at the bottom of a shared inbox.'],
              ['03', 'Signal, not noise', 'Resolution speed, agent load and CSAT — measured on live MongoDB data, not screenshots.'],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-4 border-t border-line pt-4">
                <span className="pt-1 font-mono text-[10px] text-iris">{n}</span>
                <div>
                  <div className="font-display font-bold">{t}</div>
                  <p className="mt-0.5 text-sm leading-relaxed text-mute">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-mute/70">React · Express · MongoDB · Rules engine v1</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="card relative w-full max-w-md overflow-hidden p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-iris to-transparent" />
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-iris to-cobalt font-display font-extrabold text-white">R</div>
            <div className="font-display text-xl font-bold">RELAY</div>
          </div>
          <div className="mb-7 flex rounded-xl bg-panel2 p-1">
            {[['login', 'Sign in'], ['register', 'Create account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 rounded-lg px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-all ${mode === m ? 'bg-iris text-white shadow-glow-sm' : 'text-mute hover:text-ink'}`}>
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.name} onChange={set('name')} placeholder="Ada Okafor" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="min. 6 characters" />
            </div>
            {error && <div className="rounded-lg border border-signal/40 bg-signalsoft px-3 py-2 text-sm text-signal">{error}</div>}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            {mode === 'register' && (
              <p className="font-mono text-[10px] leading-relaxed text-mute">New accounts join as customers. Agent and admin roles are provisioned internally.</p>
            )}
          </form>
          <div className="mt-8">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Demo accounts — click to fill</div>
            <div className="space-y-1.5">
              {DEMOS.map((d) => (
                <button key={d.email}
                  onClick={() => { setMode('login'); setForm({ name: '', email: d.email, password: d.password }); setError(''); }}
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-panel2 px-3 py-2.5 text-left transition-all hover:border-iris/60">
                  <span className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] ${d.chip}`}>{d.role}</span>
                  <span className="flex-1 text-sm">{d.name}</span>
                  <span className="font-mono text-[10px] text-mute">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}