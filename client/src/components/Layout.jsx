import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import Icon from './Icon';

const NAV = {
  customer: [
    { to: '/tickets', label: 'My tickets', icon: 'ticket' },
    { to: '/new', label: 'File a ticket', icon: 'plus' },
  ],
  agent: [
    { to: '/queue', label: 'Queue', icon: 'inbox' },
    { to: '/overview', label: 'Overview', icon: 'chart' },
  ],
  admin: [
    { to: '/overview', label: 'Overview', icon: 'chart' },
    { to: '/queue', label: 'All tickets', icon: 'ticket' },
    { to: '/team', label: 'Team', icon: 'users' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const items = NAV[user.role] || [];
  const current =
    items.find((i) => loc.pathname.startsWith(i.to))?.label ||
    (loc.pathname.startsWith('/tickets/') ? 'Ticket' : 'Portal');

  const [clock, setClock] = useState('');
  const [apiOk, setApiOk] = useState(null);
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB'));
    tick();
    const iv = setInterval(tick, 1000);
    fetch('/api').then((r) => setApiOk(r.ok)).catch(() => setApiOk(false));
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed -top-32 right-0 z-0 h-[26rem] w-[26rem] rounded-full bg-iris/10 blur-3xl" />
      <div className="pointer-events-none fixed -left-20 bottom-0 z-0 h-72 w-72 rounded-full bg-cobalt/10 blur-3xl" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-panel/80 backdrop-blur md:flex">
        <div className="flex items-center gap-3 px-5 pb-8 pt-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-iris to-cobalt font-display text-lg font-extrabold text-white shadow-glow-sm">R</div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight">RELAY</div>
            <div className="font-mono text-[8px] uppercase tracking-[0.26em] text-mute">Support Intelligence</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all ${isActive ? 'bg-irissoft text-white' : 'text-mute hover:bg-white/[0.04] hover:text-ink'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-iris" />}
                  <Icon name={i.icon} className={`h-4 w-4 ${isActive ? 'text-iris' : ''}`} />
                  <span>{i.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-iris to-cobalt font-display text-sm font-bold text-white">{user.name[0]}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{user.name}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-mute">{user.role}</div>
            </div>
            <button onClick={() => { logout(); nav('/login'); }} className="text-mute transition-colors hover:text-signal" title="Sign out">
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-screen flex-col md:ml-60">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/70 px-6 py-3.5 backdrop-blur-xl md:px-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">{current}</div>
          <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            <span>{clock}</span>
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${apiOk == null ? 'bg-mute' : apiOk ? 'bg-moss' : 'bg-signal'}`} />
              {apiOk == null ? 'linking' : apiOk ? 'api live' : 'api offline'}
            </span>
          </div>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-2 md:hidden">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to}
              className={({ isActive }) => `whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs transition-all ${isActive ? 'border-transparent bg-iris text-white shadow-glow-sm' : 'border-line text-mute'}`}>
              {i.label}
            </NavLink>
          ))}
        </div>
        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}