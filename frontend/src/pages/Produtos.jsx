import { useState, useEffect, useRef } from 'react';
import Topbar from '../components/Topbar';
import api from '../utils/api';
import { formatMoeda } from '../utils/format';

export default function Produtos() {
  const [produtos, setProdutos]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [busca, setBusca]         = useState('');
  const [offset, setOffset]       = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const [carregando, setCarregando] = useState(false);
  const debounce = useRef(null);

  useEffect(() => { carregar(false, ''); }, []);

  async function carregar(acumular = false, q = busca) {
    if (carregando) return;
    setLoading(!acumular);
    setCarregando(true);
    try {
      if (q.length >= 2) {
        const res = await api.get('/produtos/buscar', { params: { q } });
        setProdutos(res.data.data || []);
        setHasMore(false);
      } else {
        const off = acumular ? offset : 0;
        const res = await api.get('/produtos', { params: { offset: off } });
        const novos = res.data.data || [];
        setProdutos(prev => acumular ? [...prev, ...novos] : novos);
        setOffset(res.data.offset || 0);
        setHasMore(res.data.hasMore || false);
      }
    } finally { setLoading(false); setCarregando(false); }
  }

  function handleBusca(val) {
    setBusca(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => carregar(false, val), 320);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden' }}>
      <Topbar />
      <div className="main-content">

        <div className="page-header">
          <div>
            <h1>Produtos</h1>
            <p>{loading ? '…' : `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`}</p>
          </div>
        </div>

        {/* Busca */}
        <div style={{ marginBottom:16, position:'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--s-400)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="form-control"
            style={{ paddingLeft:40 }}
            placeholder="Buscar por nome ou código…"
            value={busca}
            onChange={e => handleBusca(e.target.value)}
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="empty-state">
            <span className="spinner" style={{ width:24, height:24, borderColor:'var(--s-300)', borderTopColor:'var(--blue-400)' }} />
          </div>
        ) : produtos.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:'0 auto', opacity:.3 }}>
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <p>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {produtos.map(p => (
                <div
                  key={p.ID}
                  style={{
                    background:'var(--s-100)',
                    border:'1px solid var(--surface-border)',
                    borderRadius:'var(--r-lg)',
                    padding:'12px 14px',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    gap:12,
                  }}
                >
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'.875rem', color:'var(--text-primary)', lineHeight:1.5 }}>
                      {p.CODIGO && <span className="prod-tag">{p.CODIGO}</span>}
                      {p.DESCRICAO}
                    </div>
                    {p.UNIDADE && <div style={{ fontSize:'.7rem', color:'var(--s-500)', marginTop:2 }}>Unidade: {p.UNIDADE}</div>}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--success)', fontSize:'.88rem', background:'var(--success-bg)', padding:'3px 9px', borderRadius:'var(--r-xs)', border:'1px solid var(--success-border)' }}>
                      {formatMoeda(p.PRECO)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                className="btn btn-secondary btn-block"
                style={{ marginTop:12, borderRadius:'var(--r-lg)' }}
                onClick={() => carregar(true)}
                disabled={carregando}
              >
                {carregando ? <span className="spinner" style={{ borderColor:'var(--s-400)', borderTopColor:'var(--text-primary)' }} /> : 'Carregar mais'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
