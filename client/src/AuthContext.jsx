import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('relay_user') || 'null'); } catch { return null; }
  });
  const [booting, setBooting] = useState(!!localStorage.getItem('relay_token'));

  useEffect(() => {
    const t = localStorage.getItem('relay_token');
    if (!t) { setBooting(false); return; }
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => {
        localStorage.removeItem('relay_token');
        localStorage.removeItem('relay_user');
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const applyAuth = ({ token, user: u }) => {
    localStorage.setItem('relay_token', token);
    localStorage.setItem('relay_user', JSON.stringify(u));
    setUser(u);
  };
  const login = async (email, password) => applyAuth((await api.post('/auth/login', { email, password })).data);
  const register = async (name, email, password) => applyAuth((await api.post('/auth/register', { name, email, password })).data);
  const logout = () => {
    localStorage.removeItem('relay_token');
    localStorage.removeItem('relay_user');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, booting, login, register, logout }}>{children}</Ctx.Provider>;
}