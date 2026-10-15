import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, tone = 'iris') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, msg, tone }]);
    setTimeout(() => setItems((l) => l.filter((i) => i.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {items.map((i) => (
          <div key={i.id} className="toast-in flex max-w-sm items-center gap-2.5 rounded-xl border border-line bg-panel2 px-4 py-3 text-sm text-ink shadow-glow-sm">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${i.tone === 'signal' ? 'bg-signal' : 'bg-iris'}`} />
            {i.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}