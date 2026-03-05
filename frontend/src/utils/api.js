import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Redireciona para login em caso de sessão expirada
// mas IGNORA o /auth/me (usado para checar se já está logado)
// e evita loop se já estiver na raiz
api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const jaEstaNoLogin = window.location.pathname === '/';
    if (
      err.response?.status === 401 &&
      !url.includes('/auth/me') &&
      !url.includes('/auth/login') &&
      !jaEstaNoLogin
    ) {
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
