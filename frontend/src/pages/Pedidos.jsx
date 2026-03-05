import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import api from '../utils/api';
import { formatMoeda, formatData, STATUS_LABEL, STATUS_CLASS } from '../utils/format';

const CHIPS = [
  { label: 'Todos', value: '' },
  { label: 'Abertos', value: 'pending' },
  { label: 'Concluídos', value: 'completed' },
  { label: 'Cancelados', value: 'cancelled' },
];

function StatusDot({ status }) {
  const colors = { pending: 'var(--warning)', completed: 'var(--success)', cancelled: 'var(--danger)' };
  return <span style={{ width:8, height:8, borderRadius:'50%', background: colors[status] || 'var(--s-400)', display:'inline-block', flexShrink:0 }} />;
}

export default function Pedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca]           = useState('');
  const [dtInicio, setDtInicio]     = useState('');
  const [dtFim, setDtFim]           = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [detalhe, setDetalhe]       = useState(null);
  const [itens, setItens]           = useState([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [modalVer, setModalVer]     = useState(false);

  useEffect(() => { carregar({}); }, [statusFiltro]);

  async function carregar(extra = {}) {
    setLoading(true);
    try {
      const params = { ...extra };
      if (statusFiltro) params.status = statusFiltro;
      const res = await api.get('/pedidos', { params });
      setPedidos(res.data.data || []);
    } finally { setLoading(false); }
  }

  function aplicarFiltros() {
    const params = {};
    if (busca) params.busca = busca;
    if (dtInicio) params.dt_inicio = dtInicio;
    if (dtFim) params.dt_fim = dtFim;
    setMostrarFiltros(false);
    carregar(params);
  }

  function limparFiltros() {
    setBusca(''); setDtInicio(''); setDtFim(''); setStatusFiltro('');
    setMostrarFiltros(false);
    carregar({});
  }

  async function verDetalhe(p) {
    setDetalhe(p); setModalVer(true); setItens([]); setLoadingItens(true);
    try {
      const res = await api.get(`/pedidos/${p.ID}/itens`);
      setItens(res.data.itens || []);
    } finally { setLoadingItens(false); }
  }

  const filtrosAtivos = busca || dtInicio || dtFim;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden' }}>
      <Topbar />
      <div className="main-content">

        <div className="page-header">
          <div>
            <h1>Pedidos</h1>
            <p>{loading ? '…' : `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''}`}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              className={`btn btn-sm ${filtrosAtivos ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMostrarFiltros(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {filtrosAtivos ? 'Filtros ●' : 'Filtros'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nova
            </button>
          </div>
        </div>

        {/* Chips de status */}
        <div className="chips-scroll">
          {CHIPS.map(chip => (
            <button key={chip.value} className={`chip${statusFiltro === chip.value ? ' active' : ''}`}
              onClick={() => setStatusFiltro(chip.value)}>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="empty-state">
            <span className="spinner" style={{ width:24, height:24, borderColor:'var(--s-300)', borderTopColor:'var(--blue-400)' }} />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:'0 auto', opacity:.3 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p>Nenhum pedido encontrado.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop:12 }} onClick={() => navigate('/dashboard')}>+ Novo Pedido</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pedidos.map(p => (
              <div
                key={p.ID}
                onClick={() => verDetalhe(p)}
                style={{
                  background:'var(--s-100)',
                  border:'1px solid var(--surface-border)',
                  borderRadius:'var(--r-lg)',
                  padding:'14px 16px',
                  cursor:'pointer',
                  transition:'all var(--base) var(--ease)',
                  position:'relative',
                  overflow:'hidden',
                }}
                onPointerDown={e => e.currentTarget.style.background = 'var(--s-150)'}
                onPointerUp={e => e.currentTarget.style.background = 'var(--s-100)'}
                onPointerLeave={e => e.currentTarget.style.background = 'var(--s-100)'}
              >
                {/* Borda lateral de status */}
                <div style={{
                  position:'absolute', left:0, top:0, bottom:0, width:3, borderRadius:'3px 0 0 3px',
                  background: p.STATUS==='completed' ? 'var(--success)' : p.STATUS==='pending' ? 'var(--warning)' : p.STATUS==='cancelled' ? 'var(--danger)' : 'var(--s-400)',
                }} />

                <div style={{ marginLeft:10 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:700, fontSize:'.78rem', color:'var(--s-500)', fontFamily:'var(--font-mono)' }}>#{p.ID}</span>
                      <span className={`badge ${STATUS_CLASS[p.STATUS] || 'badge-draft'}`}>{STATUS_LABEL[p.STATUS] || p.STATUS}</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--s-400)' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight:600, fontSize:'.9rem', color:'var(--text-primary)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.CLIENTE_NOME}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'.72rem', color:'var(--s-500)' }}>{formatData(p.CRIADO_EM)}</span>
                    <span style={{ fontWeight:800, fontFamily:'var(--font-mono)', color:'var(--blue-400)', fontSize:'.92rem' }}>{formatMoeda(p.TOTAL)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Detalhe */}
      <Modal open={modalVer} onClose={() => setModalVer(false)} title={`Pedido #${detalhe?.ID}`}>
        <div className="modal-body">
          {detalhe && (
            <div style={{ marginBottom:16, background:'var(--s-150)', borderRadius:'var(--r-md)', padding:14, border:'1px solid var(--surface-border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div>
                  <div style={{ fontSize:'.65rem', color:'var(--s-500)', textTransform:'uppercase', letterSpacing:'.3px' }}>Cliente</div>
                  <div style={{ fontWeight:700, color:'var(--text-primary)' }}>{detalhe.CLIENTE_NOME}</div>
                </div>
                <span className={`badge ${STATUS_CLASS[detalhe.STATUS] || 'badge-draft'}`}>{STATUS_LABEL[detalhe.STATUS] || detalhe.STATUS}</span>
              </div>
              <div style={{ marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <span style={{ fontSize:'.72rem', color:'var(--s-500)' }}>{formatData(detalhe.CRIADO_EM)}</span>
                <span style={{ fontWeight:800, fontFamily:'var(--font-mono)', color:'var(--blue-400)', fontSize:'1.2rem' }}>{formatMoeda(detalhe.TOTAL)}</span>
              </div>
            </div>
          )}

          {loadingItens ? (
            <div style={{ padding:24, textAlign:'center' }}>
              <span className="spinner" style={{ borderColor:'var(--s-300)', borderTopColor:'var(--blue-400)' }} />
            </div>
          ) : itens.length === 0 ? (
            <div className="autocomplete-empty">Sem itens.</div>
          ) : itens.map(i => (
            <div key={i.ID} style={{ padding:'10px 0', borderBottom:'1px solid var(--surface-border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.875rem', fontWeight:500, color:'var(--text-primary)', lineHeight:1.5 }}>
                  {i.CODIGO && <span className="prod-tag">{i.CODIGO}</span>}
                  {i.DESCRICAO}
                </div>
                <div style={{ fontSize:'.72rem', color:'var(--s-500)', marginTop:3, fontFamily:'var(--font-mono)' }}>
                  {i.QUANTIDADE} {i.UNIDADE} × {formatMoeda(i.PRECO_UNIT)}
                </div>
              </div>
              <div style={{ fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--blue-400)', fontSize:'.9rem', flexShrink:0 }}>{formatMoeda(i.TOTAL)}</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal: Filtros */}
      <Modal open={mostrarFiltros} onClose={() => setMostrarFiltros(false)} title="Filtros">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Buscar cliente / pedido</label>
            <input className="form-control" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, código…" autoFocus />
          </div>
          <div className="grid-2">
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Data início</label>
              <input className="form-control" type="date" value={dtInicio} onChange={e => setDtInicio(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Data fim</label>
              <input className="form-control" type="date" value={dtFim} onChange={e => setDtFim(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={limparFiltros}>Limpar</button>
          <button className="btn btn-primary" onClick={aplicarFiltros}>Aplicar</button>
        </div>
      </Modal>
    </div>
  );
}
