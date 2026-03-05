import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pedidos   from './pages/Pedidos';
import Clientes  from './pages/Clientes';
import Produtos  from './pages/Produtos';

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--s-0)' }}>
      <span className="spinner" style={{ width:24, height:24, borderColor:'var(--s-300)', borderTopColor:'var(--blue-400)' }} />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

const NAV = [
  { path: '/dashboard', label: 'Início', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { path: '/pedidos', label: 'Pedidos', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  )},
  { path: '/clientes', label: 'Clientes', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { path: '/produtos', label: 'Produtos', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )},
];

function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user || location.pathname === '/') return null;

  return (
    <nav className="bottom-nav">
      {NAV.map(item => {
        const active = location.pathname === item.path;
        return (
          <button key={item.path} className={`nav-btn${active ? ' active' : ''}`} onClick={() => navigate(item.path)}>
            {active && <span className="nav-btn-dot" />}
            <span className="nav-btn-icon">{item.icon}</span>
            <span className="nav-btn-lbl">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user || location.pathname === '/') return null;

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="AMM" style={{ height:22, width:'auto', display:'block' }} />
      </div>
      {NAV.map(item => {
        const active = location.pathname === item.path;
        return (
          <button key={item.path} className={`sidebar-item${active ? ' active' : ''}`} onClick={() => navigate(item.path)} title={item.label}>
            <span className="sidebar-icon">{item.icon}</span>
          </button>
        );
      })}
    </nav>
  );
}

function AppShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isLogin = !user || location.pathname === '/';
  if (isLogin) return <>{children}</>;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/"          element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/pedidos"   element={<PrivateRoute><Pedidos /></PrivateRoute>} />
              <Route path="/clientes"  element={<PrivateRoute><Clientes /></PrivateRoute>} />
              <Route path="/produtos"  element={<PrivateRoute><Produtos /></PrivateRoute>} />
              <Route path="*"          element={<Navigate to="/" />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
