import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [senha, setSenha]     = useState('');
  const [erro, setErro]       = useState('');
  const [loading, setLoading] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!senha) { setErro('Informe a senha para acessar.'); return; }
    setLoading(true); setErro('');
    try {
      await login(senha);
      navigate('/dashboard');
    } catch (err) {
      setErro(err.response?.data?.message || 'Senha incorreta. Tente novamente.');
    } finally { setLoading(false); }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb a" />
        <div className="login-bg-orb b" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="AMM" style={{ height:72, width:'auto', display:'block', filter:'drop-shadow(0 0 12px rgba(77,163,232,.5))' }} />
        </div>

        <h1 className="login-title">Bem‑vindo</h1>
        <p className="login-sub">AMM Gestor de Pedidos — informe sua senha</p>

        {erro && (
          <div className="login-erro">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha de acesso</label>
            <div className="senha-wrap">
              <input
                id="senha"
                className="form-control"
                type={visivel ? 'text' : 'password'}
                inputMode="numeric"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                autoFocus
              />
              <button type="button" className="btn-revelar" onClick={() => setVisivel(v => !v)} tabIndex={-1}>
                {visivel ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
            {loading ? <><span className="spinner" style={{ borderColor:'rgba(255,255,255,.25)', borderTopColor:'#fff' }}></span> Verificando…</> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
