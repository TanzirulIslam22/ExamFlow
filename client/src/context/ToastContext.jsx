import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

const styles = {
  success: { bg: 'bg-white', border: 'border-success/30', icon: <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> },
  error: { bg: 'bg-white', border: 'border-danger/30', icon: <XCircle className="h-5 w-5 text-danger shrink-0" /> },
  info: { bg: 'bg-white', border: 'border-primary/30', icon: <Info className="h-5 w-5 text-primary shrink-0" /> },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const toast = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles[t.type].bg} ${styles[t.type].border} border rounded-card shadow-overlay px-4 py-3 flex items-start gap-3 animate-slideUp`}
          >
            {styles[t.type].icon}
            <p className="text-sm text-ink leading-snug">{t.message}</p>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="ml-auto text-gray-light hover:text-ink transition-colors">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
