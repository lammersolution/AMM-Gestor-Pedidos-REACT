import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';
import { formatMoeda, formatData, STATUS_LABEL, STATUS_CLASS } from '../utils/format';

function IcPlus() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IcCheck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IcChevron() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}

function iniciais(nome) {
  if (!nome) return '?';
  return nome.trim().split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase();
}

function corAvatar(nome) {
  const cores = ['#3b82f6','#ef4444','#8b5cf6','#06b6d4','#10b981','#f97316','#ec4899','#6366f1'];
  let hash = 0;
  for (const c of (nome || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return cores[Math.abs(hash) % cores.length];
}

export default function Clientes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientes, setClientes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [busca, setBusca]             = useState('');
  const [modalNovo, setModalNovo]     = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [clienteSel, setClienteSel]   = useState(null);
  const [pedidosCliente, setPedidosCliente] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [novoNome, setNovoNome]       = useState('');
  const [salvando, setSalvando]       = useState(false);
  const debounce = useRef(null);

  useEffect(() => { carregarClientes(); }, []);

  async function carregarClientes(q = '') {
    setLoading(true);
    try {
      const endpoint = q.length >= 2 ? `/clientes/buscar?q=${encodeURIComponent(q)}` : '/clientes';
      const res = await api.get(endpoint);
      setClientes(res.data.data || []);
    } catch { toast('Erro ao carregar clientes.', 'error'); }
    finally { setLoading(false); }
  }

  function handleBusca(val) {
    setBusca(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => carregarClientes(val), 320);
  }

  async function abrirDetalhe(c) {
    setClienteSel(c); setModalDetalhe(true);
    setPedidosCliente([]); setLoadingPedidos(true);
    try {
      const res = await api.get('/pedidos', { params: { busca: c.NOME } });
      setPedidosCliente((res.data.data || []).slice(0,10));
    } catch {} finally { setLoadingPedidos(false); }
  }

  async function salvarNovoCliente() {
    if (novoNome.trim().length < 2) { toast('Informe o nome.', 'warning'); return; }
    setSalvando(true);
    try {
      const res = await api.post('/clientes', { nome: novoNome.trim() });
      if (res.data.success) {
        toast(`"${res.data.cliente.NOME}" cadastrado!`, 'success');
        setModalNovo(false); setNovoNome('');
        carregarClientes(busca);
      }
    } catch { toast('Erro ao cadastrar.', 'error'); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden' }}>
      <Topbar />
      <div className="main-content">

        <div className="page-header">
          <div>
            <h1>Clientes</h1>
            <p>{loading ? '…' : `${clientes.length} encontrado${clientes.length !== 1 ? 's' : ''}`}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalNovo(true)}>
            <IcPlus /> Novo
          </button>
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
            placeholder="Buscar cliente…"
            value={busca}
            onChange={e => handleBusca(e.target.value)}
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="empty-state">
            <span className="spinner" style={{ width:24, height:24, borderColor:'var(--s-300)', borderTopColor:'var(--blue-400)' }} />
          </div>
        ) : clientes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:'0 auto', opacity:.3 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {clientes.map(c => (
              <div
                key={c.ID}
                onClick={() => abrirDetalhe(c)}
                style={{
                  background:'var(--s-100)',
                  border:'1px solid var(--surface-border)',
                  borderRadius:'var(--r-lg)',
                  padding:'12px 14px',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:12,
                  transition:'all var(--base) var(--ease)',
                }}
                onPointerDown={e => e.currentTarget.style.background = 'var(--s-150)'}
                onPointerUp={e => e.currentTarget.style.background = 'var(--s-100)'}
                onPointerLeave={e => e.currentTarget.style.background = 'var(--s-100)'}
              >
                <div className="avatar" style={{ background: corAvatar(c.NOME), fontSize:'.75rem' }}>
                  {iniciais(c.NOME)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:'.9rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.NOME}</div>
                  {c.CODIGO && <div style={{ fontSize:'.7rem', color:'var(--s-500)', fontFamily:'var(--font-mono)', marginTop:2 }}>Cód: {c.CODIGO}</div>}
                </div>
                <span style={{ color:'var(--s-400)', flexShrink:0 }}><IcChevron /></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Detalhe */}
      <Modal open={modalDetalhe} onClose={() => setModalDetalhe(false)} title={clienteSel?.NOME}>
        <div className="modal-body">
          {clienteSel && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, padding:'14px 0', borderBottom:'1px solid var(--surface-border)' }}>
                <div className="avatar" style={{ width:52, height:52, background: corAvatar(clienteSel.NOME), fontSize:'.9rem', borderRadius:'var(--r-md)' }}>
                  {iniciais(clienteSel.NOME)}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)' }}>{clienteSel.NOME}</div>
                  {clienteSel.CODIGO && <div style={{ fontSize:'.76rem', color:'var(--s-500)', fontFamily:'var(--font-mono)', marginTop:3 }}>Código: {clienteSel.CODIGO}</div>}
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex:1, borderRadius:'var(--r-md)' }}
                  onClick={() => { setModalDetalhe(false); navigate('/dashboard', { state: { clienteId: clienteSel.ID, clienteNome: clienteSel.NOME } }); }}
                >
                  + Novo Pedido
                </button>
              </div>

              <div style={{ fontSize:'.78rem', fontWeight:700, color:'var(--s-500)', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:10 }}>
                Últimos pedidos
              </div>

              {loadingPedidos ? (
                <div style={{ padding:16, textAlign:'center' }}>
                  <span className="spinner" style={{ borderColor:'var(--s-300)', borderTopColor:'var(--blue-400)' }} />
                </div>
              ) : pedidosCliente.length === 0 ? (
                <div style={{ padding:'12px 0', color:'var(--s-500)', fontSize:'.85rem' }}>Nenhum pedido encontrado.</div>
              ) : pedidosCliente.map(p => (
                <div key={p.ID} style={{ padding:'10px 0', borderBottom:'1px solid var(--surface-border)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'.72rem', color:'var(--s-500)' }}>#{p.ID}</span>
                      <span className={`badge ${STATUS_CLASS[p.STATUS] || 'badge-draft'}`}>{STATUS_LABEL[p.STATUS] || p.STATUS}</span>
                    </div>
                    <div style={{ fontSize:'.72rem', color:'var(--s-500)' }}>{formatData(p.CRIADO_EM)}</div>
                  </div>
                  <span style={{ fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--blue-400)' }}>{formatMoeda(p.TOTAL)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </Modal>

      {/* Modal: Novo Cliente */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Novo Cliente">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input className="form-control" value={novoNome} onChange={e => setNovoNome(e.target.value)}
              autoFocus placeholder="Nome do cliente…"
              onKeyDown={e => e.key === 'Enter' && salvarNovoCliente()} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalNovo(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvarNovoCliente} disabled={salvando}>
            {salvando ? <span className="spinner" style={{ borderColor:'rgba(0,0,0,.2)', borderTopColor:'#000' }} /> : <><IcCheck /> Salvar</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
