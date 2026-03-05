import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, tipo = 'info', dur = 3200) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), dur);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.tipo}`}>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
