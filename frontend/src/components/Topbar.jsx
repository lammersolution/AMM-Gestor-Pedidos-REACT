import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Topbar({ onImportar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() { await logout(); navigate('/'); }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-brand-mark">
          <img src="/logo.png" alt="AMM" style={{ height:22, width:'auto', display:'block', filter:'drop-shadow(0 0 8px rgba(77,163,232,.4))' }} />
        </div>
        <span className="topbar-brand-text">AMM <small>Gestor de Pedidos</small></span>
      </div>
      <div className="topbar-end">
        <span className="topbar-user-chip">Olá, <strong>{user?.nome?.split(' ')[0]}</strong></span>
        {onImportar && (
          <button className="topbar-btn" onClick={onImportar} title="Importar pedido">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        )}
        <button className="topbar-btn danger" onClick={handleLogout} title="Sair">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
