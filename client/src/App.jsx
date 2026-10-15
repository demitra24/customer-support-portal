import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './components/toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import MyTickets from './pages/MyTickets';
import NewTicket from './pages/NewTicket';
import Queue from './pages/Queue';
import Overview from './pages/Overview';
import Team from './pages/Team';
import TicketDetail from './pages/TicketDetail';

export const homeFor = (role) => ({ customer: '/tickets', agent: '/queue', admin: '/overview' }[role] || '/login');

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper text-iris">
      <div className="animate-pulse font-display text-2xl tracking-[0.35em]">RELAY</div>
    </div>
  );
}

function Guard({ roles, children }) {
  const { user, booting } = useAuth();
  if (booting) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

function Home() {
  const { user, booting } = useAuth();
  if (booting) return <Splash />;
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Guard><Layout /></Guard>}>
              <Route path="/" element={<Home />} />
              <Route path="/tickets" element={<Guard roles={['customer']}><MyTickets /></Guard>} />
              <Route path="/new" element={<Guard roles={['customer']}><NewTicket /></Guard>} />
              <Route path="/queue" element={<Guard roles={['agent', 'admin']}><Queue /></Guard>} />
              <Route path="/overview" element={<Guard roles={['agent', 'admin']}><Overview /></Guard>} />
              <Route path="/team" element={<Guard roles={['admin']}><Team /></Guard>} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}