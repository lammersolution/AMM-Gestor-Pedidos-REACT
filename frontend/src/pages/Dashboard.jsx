import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal   from '../components/Modal';
import { useAuth }  from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';
import { formatMoeda, formatQtd } from '../utils/format';

const FIXED_TOP_ID = 'dashboard-fixed-top';
const FIXED_BOT_ID = 'dashboard-fixed-bot';

function IcUser() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IcPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IcCheck() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IcX() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IcMinus() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IcDownload() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IcLogout() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function IcTheme({ dark }) {
  return dark
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function IcEdit() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IcChevron() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast }        = useToast();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [pedidoId, setPedidoId]       = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('amm_pedido'))?.pedidoId || null; } catch { return null; }
  });
  const [itens, setItens]             = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('amm_pedido'))?.itens || []; } catch { return []; }
  });
  const [total, setTotal]             = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('amm_pedido'))?.total || 0; } catch { return 0; }
  });
  const [clienteId, setClienteId]     = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('amm_pedido'))?.clienteId || ''; } catch { return ''; }
  });
  const [clienteNome, setClienteNome] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('amm_pedido'))?.clienteNome || ''; } catch { return ''; }
  });
  const [clienteBloqueado, setClienteBloqueado] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('amm_pedido'))?.clienteBloqueado || false; } catch { return false; }
  });

  const [modalConfirm, setModalConfirm] = useState(null); // { msg, onOk, okLabel, okClass }
  const [modalClientes, setModalClientes]       = useState(false);
  const [modalProdutos, setModalProdutos]       = useState(false);
  const [modalCancelar, setModalCancelar]       = useState(false);
  const [modalConcluir, setModalConcluir]       = useState(false);
  const [modalSucesso, setModalSucesso]         = useState(false);
  const [modalImportar, setModalImportar]       = useState(false);
  const [modalVerPedido, setModalVerPedido]     = useState(false);
  const [modalNovoCliente, setModalNovoCliente] = useState(false);

  const [clientes, setClientes]           = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [produtos, setProdutos]           = useState([]);
  const [filtroProduto, setFiltroProduto] = useState('');
  const [prodOffset, setProdOffset]       = useState(0);
  const [prodHasMore, setProdHasMore]     = useState(false);
  const [prodCarregando, setProdCarregando] = useState(false);
  const [qtdsProdutos, setQtdsProdutos]   = useState({});
  const [qtdsEditando, setQtdsEditando]   = useState({});
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [pedidosImportar, setPedidosImportar] = useState([]);
  const [pedidoVerItens, setPedidoVerItens]   = useState(null);
  const [pedidoVerDados, setPedidoVerDados]   = useState(null);
  const [pedidoParaImportar, setPedidoParaImportar] = useState(null);
  const [tema] = useState('escuro');

  const prodDebounce = useRef(null);
  const pedidoIdRef  = useRef(null);

  useEffect(() => { pedidoIdRef.current = pedidoId; }, [pedidoId]);

  useEffect(() => {
    if (pedidoId) {
      sessionStorage.setItem('amm_pedido', JSON.stringify({ pedidoId, itens, total, clienteId, clienteNome, clienteBloqueado }));
    } else {
      sessionStorage.removeItem('amm_pedido');
    }
  }, [pedidoId, itens, total, clienteId, clienteNome, clienteBloqueado]);

  useEffect(() => {
    const state = location.state;
    if (state?.clienteId && state?.clienteNome) {
      selecionarCliente(state.clienteId, state.clienteNome);
      navigate('/dashboard', { replace: true, state: {} });
    }
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', '');
  }, []);

  useEffect(() => {
    const handle = e => {
      if (pedidoIdRef.current) {
        const fd = new FormData();
        fd.append('acao', 'cancelar_pedido');
        fd.append('pedido_id', pedidoIdRef.current);
        navigator.sendBeacon('/api/pedidos/' + pedidoIdRef.current + '/cancelar', fd);
        sessionStorage.removeItem('amm_pedido');
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, []);

  function confirmar(msg, onOk, okLabel = 'Confirmar', okClass = 'btn-danger') {
    setModalConfirm({ msg, onOk, okLabel, okClass });
  }

  function selecionarCliente(id, nome) {
    setClienteId(id); setClienteNome(nome);
  }

  async function abrirModalClientes() {
    setModalClientes(true); setFiltroCliente('');
    const res = await api.get('/clientes');
    setClientes(res.data.data || []);
  }

  const clientesFiltrados = clientes.filter(c =>
    !filtroCliente ||
    c.NOME?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
    (c.CODIGO || '').toLowerCase().includes(filtroCliente.toLowerCase())
  );

  function abrirModalProdutos() {
    if (!clienteId) { toast('Selecione um cliente primeiro.', 'warning'); return; }
    setModalProdutos(true); setFiltroProduto(''); setProdutos([]); setProdOffset(0); setProdHasMore(false);
  }

  useEffect(() => {
    if (!filtroProduto || filtroProduto.length < 2) return;
    clearTimeout(prodDebounce.current);
    setProdCarregando(true);
    prodDebounce.current = setTimeout(async () => {
      try {
        const res = await api.get('/produtos/buscar', { params: { q: filtroProduto } });
        setProdutos(res.data.data || []);
        setProdHasMore(false);
      } finally { setProdCarregando(false); }
    }, 300);
  }, [filtroProduto]);

  async function carregarTodosProdutos(acumular = false) {
    if (prodCarregando) return;
    setProdCarregando(true);
    const offset = acumular ? prodOffset : 0;
    try {
      const res = await api.get('/produtos', { params: { offset } });
      const novos = res.data.data || [];
      setProdutos(prev => acumular ? [...prev, ...novos] : novos);
      setProdOffset(res.data.offset || 0);
      setProdHasMore(res.data.hasMore || false);
    } finally { setProdCarregando(false); }
  }

  async function adicionarItem(p) {
    const qtd = parseFloat(String(qtdsProdutos[p.ID] || '1').replace(',', '.'));
    if (!(qtd > 0)) { toast('Quantidade inválida.', 'warning'); return; }
    try {
      const res = await api.post('/pedidos/item', {
        pedido_id: pedidoId || '', cliente_id: clienteId, cliente_nome: clienteNome,
        produto_id: p.ID, produto_ean: p.CODIGO || '', produto_desc: p.DESCRICAO,
        produto_un: p.UNIDADE || 'UN', preco: p.PRECO, quantidade: qtd,
      });
      if (res.data.success) {
        setPedidoId(res.data.pedido_id);
        setItens(prev => {
          const existe = prev.find(i => i.ID === res.data.item.ID);
          if (existe) return prev.map(i => i.ID === res.data.item.ID ? res.data.item : i);
          return [...prev, res.data.item];
        });
        setTotal(res.data.total);
        setClienteBloqueado(true);
        setQtdsProdutos(prev => ({ ...prev, [p.ID]: '1' }));
        toast(`${p.DESCRICAO} adicionado!`, 'success');
      } else { toast(res.data.message || 'Erro ao adicionar.', 'error'); }
    } catch (err) { toast('Erro: ' + (err.response?.data?.message || err.message), 'error'); }
  }

  async function atualizarQtd(itemId, novaQtd) {
    const qtd = parseFloat(novaQtd);
    if (!(qtd > 0)) return;
    try {
      const res = await api.put(`/pedidos/item/${itemId}`, { quantidade: qtd });
      if (res.data.success) {
        setItens(prev => prev.map(i => i.ID === itemId ? { ...i, QUANTIDADE: qtd, TOTAL: res.data.item_total } : i));
        setTotal(res.data.pedido_total);
      }
    } catch {}
  }

  async function excluirItem(itemId) {
    confirmar('Remover este item do pedido?', async () => {
      try {
        const res = await api.delete(`/pedidos/item/${itemId}`);
        if (res.data.success) {
          setItens(prev => {
            const novos = prev.filter(i => i.ID !== itemId);
            const totalLocal = novos.reduce((acc, i) => acc + parseFloat(i.TOTAL || 0), 0);
            setTotal(res.data.pedido_total > 0 ? res.data.pedido_total : totalLocal);
            return novos;
          });
          toast('Item removido.', 'info');
        }
      } catch {}
    }, 'Remover', 'btn-danger');
  }

  async function executarCancelamento() {
    if (!pedidoId) return;
    try {
      await api.post(`/pedidos/${pedidoId}/cancelar`);
      setPedidoId(null); setItens([]); setTotal(0);
      setClienteId(''); setClienteNome(''); setClienteBloqueado(false);
      setModalCancelar(false);
      toast('Pedido cancelado.', 'info');
    } catch { toast('Erro ao cancelar.', 'error'); }
  }

  async function executarConclusao() {
    try {
      const res = await api.post(`/pedidos/${pedidoId}/concluir`);
      if (res.data.success) { setModalConcluir(false); setModalSucesso(true); }
      else toast(res.data.message || 'Erro.', 'error');
    } catch {}
  }

  function novaVenda() {
    setModalSucesso(false);
    setPedidoId(null); setItens([]); setTotal(0);
    setClienteId(''); setClienteNome(''); setClienteBloqueado(false);
  }

  async function abrirImportacao() {
    if (!clienteNome.trim()) { toast('Informe o cliente antes de importar.', 'warning'); return; }
    setModalImportar(true);
    const res = await api.get('/pedidos/para-importar');
    setPedidosImportar(res.data.data || []);
  }

  async function verPedidoImportar(p) {
    setPedidoParaImportar(p); setPedidoVerDados(p);
    setModalImportar(false); setModalVerPedido(true);
    const res = await api.get(`/pedidos/${p.ID}/itens`);
    setPedidoVerItens(res.data.itens || []);
  }

  async function confirmarImportacao() {
    if (!pedidoParaImportar) return;
    if (!clienteId || !clienteNome.trim()) {
      toast('Selecione um cliente antes de importar.', 'warning');
      setModalVerPedido(false); return;
    }
    try {
      const res = await api.post('/pedidos/importar', {
        pedido_origem_id: pedidoParaImportar.ID, cliente_id: clienteId, cliente_nome: clienteNome,
      });
      if (res.data.success) {
        setPedidoId(res.data.pedido_id);
        const itensRes = await api.get(`/pedidos/${res.data.pedido_id}/itens`);
        setItens(itensRes.data.itens || []);
        setTotal(itensRes.data.pedido?.TOTAL || itensRes.data.pedido?.total || 0);
        setClienteBloqueado(true);
        setModalVerPedido(false);
        toast('Itens importados!', 'success');
      }
    } catch { toast('Erro ao importar.', 'error'); }
  }

  async function salvarNovoCliente() {
    if (novoClienteNome.trim().length < 2) { toast('Informe o nome.', 'warning'); return; }
    try {
      const res = await api.post('/clientes', { nome: novoClienteNome.trim() });
      if (res.data.success) {
        selecionarCliente(res.data.cliente.ID, res.data.cliente.NOME);
        setModalNovoCliente(false); setNovoClienteNome('');
        toast(`"${res.data.cliente.NOME}" cadastrado!`, 'success');
      }
    } catch {}
  }

  const temItens = itens.length > 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', minHeight:0, overflow:'hidden' }}>

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header className="topbar" style={{ flexShrink:0 }}>
        <div className="topbar-brand">
          <div className="topbar-brand-mark">
            <img src="/logo.png" alt="AMM" style={{ height:22, width:'auto', display:'block', filter:'drop-shadow(0 0 8px rgba(77,163,232,.4))' }} />
          </div>
          <span className="topbar-brand-text">AMM <small>Gestor de Pedidos</small></span>
        </div>
        <div className="topbar-end">
          <span className="topbar-user-chip">Olá, <strong>{user?.nome?.split(' ')[0]}</strong></span>
          <button className="topbar-btn" onClick={abrirImportacao} title="Importar pedido"><IcDownload /></button>
          <button className="topbar-btn danger" onClick={async () => { await logout(); navigate('/'); }} title="Sair"><IcLogout /></button>
        </div>
      </header>

      {/* ── Área fixa: status + cliente + botão ─────────────── */}
      <div id={FIXED_TOP_ID} style={{ flexShrink:0, padding:'12px 16px 0', background:'var(--surface)', borderBottom: temItens ? '1px solid var(--surface-border)' : 'none' }}>

        <div className={`status-bar ${temItens ? 'pending' : 'new'}`}>
          <span className="status-dot" />
          {temItens
            ? <>Pedido em andamento {pedidoId && <span style={{ fontWeight:400, opacity:.6, fontFamily:'var(--font-mono)', fontSize:'.78rem' }}>#{pedidoId}</span>}</>
            : <>Nova venda — selecione cliente e adicione produtos</>
          }
        </div>

        {/* Cliente selector */}
        <div
          className={`cliente-selector${clienteId ? ' selected' : ''}`}
          onClick={() => { if (!clienteBloqueado) abrirModalClientes(); }}
        >
          <div className="cs-avatar">
            <IcUser />
          </div>
          <div className="cs-info">
            <div className="cs-label">{clienteId ? 'Cliente' : 'Toque para selecionar'}</div>
            <div className="cs-nome">{clienteNome || 'Nenhum cliente selecionado'}</div>
          </div>
          {clienteBloqueado
            ? <button className="btn btn-xs btn-secondary" onClick={e => { e.stopPropagation(); setClienteBloqueado(false); setClienteId(''); setClienteNome(''); }} style={{ flexShrink:0, gap:4 }}>
                <IcEdit /> Trocar
              </button>
            : <span style={{ color:'var(--s-400)', flexShrink:0 }}><IcChevron /></span>
          }
        </div>

        {/* Botão adicionar */}
        <button
          className="btn btn-primary btn-block"
          style={{ borderRadius:'var(--r-lg)', padding:'12px', marginBottom:'12px', gap:8 }}
          onClick={abrirModalProdutos}
          disabled={!clienteId}
        >
          <IcPlus /> Adicionar Produto
        </button>

        {/* Total bar */}
        {temItens && (
          <div className="total-bar" style={{ marginBottom:'12px' }}>
            <div className="total-bar-left">
              <span className="badge badge-count">{itens.length}</span>
              <span style={{ fontSize:'.76rem', color:'var(--s-500)', fontWeight:500 }}>{itens.length === 1 ? 'item' : 'itens'}</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <span className="total-label">Total</span>
              <span className="total-valor">{formatMoeda(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Lista de itens (scroll) ──────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', padding:'10px 16px 10px' }}>
        {!temItens ? (
          <div className="empty-state" style={{ paddingTop:'32px' }}>
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:.3, margin:'0 auto' }}>
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <p style={{ marginTop:12 }}>Nenhum produto adicionado.<br />Selecione um cliente e toque em <strong>Adicionar Produto</strong>.</p>
          </div>
        ) : (
          itens.map(item => (
            <div key={item.ID} className="item-card">
              <div className="item-card-top">
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="item-card-nome">
                    {item.CODIGO && <span className="prod-tag">{item.CODIGO}</span>}
                    {item.DESCRICAO}
                  </div>
                </div>
                <button
                  className="btn btn-icon"
                  style={{ background:'var(--danger-bg)', color:'var(--danger)', border:'1px solid var(--danger-border)', width:32, height:32, minWidth:32, borderRadius:'var(--r-sm)' }}
                  onClick={() => excluirItem(item.ID)}
                >
                  <IcX />
                </button>
              </div>
              <div className="item-card-bottom">
                <div className="qty-control">
                  <button className="btn-qty" onClick={() => {
                    const nova = Math.max(0.001, parseFloat(item.QUANTIDADE) - 0.1);
                    atualizarQtd(item.ID, nova);
                    setQtdsEditando(prev => ({ ...prev, [item.ID]: undefined }));
                  }}><IcMinus /></button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={qtdsEditando[item.ID] !== undefined ? qtdsEditando[item.ID] : parseFloat(item.QUANTIDADE).toFixed(3).replace('.', ',')}
                    onFocus={e => {
                      const txt = parseFloat(item.QUANTIDADE).toFixed(3).replace('.', ',');
                      setQtdsEditando(prev => ({ ...prev, [item.ID]: txt }));
                      setTimeout(() => e.target.select(), 0);
                    }}
                    onChange={e => setQtdsEditando(prev => ({ ...prev, [item.ID]: e.target.value }))}
                    onBlur={e => {
                      const raw = e.target.value.replace(',', '.');
                      const n = parseFloat(raw);
                      if (!isNaN(n) && n > 0) atualizarQtd(item.ID, n);
                      setQtdsEditando(prev => ({ ...prev, [item.ID]: undefined }));
                    }}
                  />
                  <button className="btn-qty" onClick={() => {
                    const nova = parseFloat(item.QUANTIDADE) + 0.1;
                    atualizarQtd(item.ID, nova);
                    setQtdsEditando(prev => ({ ...prev, [item.ID]: undefined }));
                  }}>+</button>
                </div>
                <div className="item-total-wrap">
                  <div className="item-total-label">Total</div>
                  <div className="item-total-valor">{formatMoeda(item.TOTAL)}</div>
                </div>
              </div>
              <div className="item-unit-price">Unit.: {formatMoeda(item.PRECO_UNIT)}</div>
            </div>
          ))
        )}
      </div>

      {/* ── Botões Cancelar / Concluir ──────────────────────── */}
      {(temItens || pedidoId) && (
        <div id={FIXED_BOT_ID} className="bottom-actions" style={{ bottom:0, position:'sticky' }}>
          <button className="btn btn-danger" onClick={() => setModalCancelar(true)}>
            <IcX /> Cancelar
          </button>
          <button className="btn btn-success" disabled={!temItens} onClick={() => setModalConcluir(true)}>
            <IcCheck /> Concluir Pedido
          </button>
        </div>
      )}

      {/* ── Modal: Clientes ──────────────────────────────────── */}
      <Modal open={modalClientes} onClose={() => setModalClientes(false)} title="Selecionar Cliente">
        <div className="modal-search">
          <div style={{ display:'flex', gap:'8px' }}>
            <input className="form-control" placeholder="Buscar cliente…" autoFocus
              value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={() => { setModalClientes(false); setModalNovoCliente(true); }}>
              <IcPlus /> Novo
            </button>
          </div>
        </div>
        <div className="modal-body">
          {clientesFiltrados.length === 0 ? (
            <div className="autocomplete-empty">Nenhum cliente encontrado.</div>
          ) : clientesFiltrados.map(c => (
            <div key={c.ID} className="autocomplete-item" onClick={() => { selecionarCliente(c.ID, c.NOME); setModalClientes(false); }}>
              <div>
                <div style={{ fontWeight:600, fontSize:'.875rem', color:'var(--text-primary)' }}>{c.NOME}</div>
                {c.CODIGO && <div style={{ fontSize:'.72rem', color:'var(--s-500)', marginTop:2 }}>Cód: {c.CODIGO}</div>}
              </div>
              <span style={{ color:'var(--s-400)' }}><IcChevron /></span>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Modal: Novo Cliente ──────────────────────────────── */}
      <Modal open={modalNovoCliente} onClose={() => setModalNovoCliente(false)} title="Novo Cliente">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nome do Cliente *</label>
            <input className="form-control" value={novoClienteNome}
              onChange={e => setNovoClienteNome(e.target.value)} autoFocus placeholder="Nome completo…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalNovoCliente(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvarNovoCliente}><IcCheck /> Salvar</button>
        </div>
      </Modal>

      {/* ── Modal: Produtos ──────────────────────────────────── */}
      <Modal open={modalProdutos} onClose={() => setModalProdutos(false)} title="Adicionar Produto">
        <div className="modal-search">
          <div style={{ display:'flex', gap:'8px' }}>
            <input className="form-control" placeholder="Buscar produto…" autoFocus
              value={filtroProduto}
              onChange={e => { setFiltroProduto(e.target.value); if (!e.target.value) setProdutos([]); }} />
            <button className="btn btn-secondary btn-sm" onClick={() => carregarTodosProdutos(false)}>Todos</button>
          </div>
        </div>
        <div className="modal-body">
          {prodCarregando && !produtos.length ? (
            <div className="autocomplete-empty">
              <span className="spinner" style={{ borderColor:'var(--s-300)', borderTopColor:'var(--blue-400)' }} />
            </div>
          ) : !produtos.length ? (
            <div className="prod-modal-dica">
              Digite para buscar ou{' '}
              <button className="btn-link" onClick={() => carregarTodosProdutos(false)}>ver todos os produtos</button>
            </div>
          ) : produtos.map(p => (
            <div key={p.ID} className="prod-row">
              <div className="prod-row-top">
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="prod-nome">
                    {p.CODIGO && <span className="prod-tag">{p.CODIGO}</span>}
                    {p.DESCRICAO}
                  </div>
                </div>
                <span className="prod-preco-tag">{formatMoeda(p.PRECO)}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <div className="qty-control">
                  <button className="btn-qty" onClick={() => {
                    const nova = Math.max(0.001, parseFloat(qtdsProdutos[p.ID] || 1) - 0.1).toFixed(3);
                    setQtdsProdutos(prev => ({ ...prev, [p.ID]: nova }));
                    setQtdsEditando(prev => ({ ...prev, [`m_${p.ID}`]: undefined }));
                  }}><IcMinus /></button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={qtdsEditando[`m_${p.ID}`] !== undefined ? qtdsEditando[`m_${p.ID}`] : parseFloat(qtdsProdutos[p.ID] || 1).toFixed(3).replace('.', ',')}
                    onFocus={e => {
                      const txt = parseFloat(qtdsProdutos[p.ID] || 1).toFixed(3).replace('.', ',');
                      setQtdsEditando(prev => ({ ...prev, [`m_${p.ID}`]: txt }));
                      setTimeout(() => e.target.select(), 0);
                    }}
                    onChange={e => setQtdsEditando(prev => ({ ...prev, [`m_${p.ID}`]: e.target.value }))}
                    onBlur={e => {
                      const raw = e.target.value.replace(',', '.');
                      const n = parseFloat(raw);
                      const val = (isNaN(n) || n <= 0 ? 1 : n).toFixed(3);
                      setQtdsProdutos(prev => ({ ...prev, [p.ID]: val }));
                      setQtdsEditando(prev => ({ ...prev, [`m_${p.ID}`]: undefined }));
                    }}
                  />
                  <button className="btn-qty" onClick={() => {
                    const nova = (parseFloat(qtdsProdutos[p.ID] || 1) + 0.1).toFixed(3);
                    setQtdsProdutos(prev => ({ ...prev, [p.ID]: nova }));
                    setQtdsEditando(prev => ({ ...prev, [`m_${p.ID}`]: undefined }));
                  }}>+</button>
                </div>
                <button className="btn btn-success btn-sm" onClick={() => adicionarItem(p)}><IcPlus /> Adicionar</button>
              </div>
            </div>
          ))}
          {prodHasMore && (
            <button className="btn btn-secondary btn-block" style={{ marginTop:12 }} onClick={() => carregarTodosProdutos(true)} disabled={prodCarregando}>
              {prodCarregando ? <span className="spinner" /> : 'Carregar mais'}
            </button>
          )}
        </div>
      </Modal>

      {/* ── Modal: Cancelar ──────────────────────────────────── */}
      <Modal open={modalCancelar} onClose={() => setModalCancelar(false)} title="Cancelar Pedido">
        <div className="modal-body">
          <p style={{ marginBottom:16, color:'var(--s-600)', fontSize:'.875rem' }}>
            Tem certeza que deseja cancelar? Esta ação não pode ser desfeita.
          </p>
          <div className="form-group">
            <label className="form-label">Motivo (opcional)</label>
            <input className="form-control" value={motivoCancelamento}
              onChange={e => setMotivoCancelamento(e.target.value)} placeholder="Ex: Cliente desistiu…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalCancelar(false)}>Voltar</button>
          <button className="btn btn-danger" onClick={executarCancelamento}><IcX /> Cancelar Pedido</button>
        </div>
      </Modal>

      {/* ── Modal: Concluir ──────────────────────────────────── */}
      <Modal open={modalConcluir} onClose={() => setModalConcluir(false)} title="Confirmar Pedido">
        <div className="modal-body">
          <div style={{ background:'var(--s-150)', borderRadius:'var(--r-md)', padding:16, marginBottom:16, border:'1px solid var(--surface-border)' }}>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:'.65rem', color:'var(--s-500)', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:3 }}>Cliente</div>
              <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)' }}>{clienteNome}</div>
            </div>
            <div>
              <div style={{ fontSize:'.65rem', color:'var(--s-500)', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:3 }}>Total do Pedido</div>
              <div style={{ fontWeight:800, fontSize:'1.5rem', color:'var(--amber)', fontFamily:'var(--font-condensed)' }}>{formatMoeda(total)}</div>
            </div>
          </div>
          <p style={{ fontSize:'.82rem', color:'var(--s-500)' }}>
            {itens.length} produto(s) — ao confirmar, o pedido fica disponível para o ERP importar.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalConcluir(false)}>Voltar</button>
          <button className="btn btn-success" onClick={executarConclusao}><IcCheck /> Confirmar</button>
        </div>
      </Modal>

      {/* ── Modal: Sucesso ────────────────────────────────────── */}
      <Modal open={modalSucesso} center noClickOutside>
        <div className="sucesso-wrap">
          <div className="sucesso-icone">✅</div>
          <div className="sucesso-titulo">Pedido Concluído!</div>
          <div className="sucesso-num">#{pedidoId}</div>
          <p className="sucesso-msg">Registrado com sucesso. O ERP irá importar automaticamente.</p>
          <button className="btn btn-primary btn-block" style={{ borderRadius:'var(--r-lg)', padding:14 }} onClick={novaVenda}>
            <IcPlus /> Nova Venda
          </button>
        </div>
      </Modal>

      {/* ── Modal: Importar ──────────────────────────────────── */}
      <Modal open={modalImportar} onClose={() => setModalImportar(false)} title="Importar Pedido">
        <div className="modal-body">
          {pedidosImportar.length === 0 ? (
            <div className="autocomplete-empty">Nenhum pedido disponível para importar.</div>
          ) : pedidosImportar.map(p => (
            <div key={p.ID} className="autocomplete-item" onClick={() => verPedidoImportar(p)}>
              <div>
                <div style={{ fontWeight:700, fontSize:'.72rem', color:'var(--s-500)', fontFamily:'var(--font-mono)' }}>#{p.ID}</div>
                <div style={{ fontWeight:600, fontSize:'.9rem', color:'var(--text-primary)' }}>{p.CLIENTE_NOME}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontWeight:700, fontFamily:'var(--font-condensed)', color:'var(--amber)', fontSize:'.9rem' }}>{formatMoeda(p.TOTAL)}</div>
                <IcChevron />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Modal: Ver Pedido ─────────────────────────────────── */}
      <Modal open={modalVerPedido} onClose={() => { setModalVerPedido(false); setModalImportar(true); }} title={`Pedido #${pedidoVerDados?.ID}`}>
        <div className="modal-body">
          {(pedidoVerItens || []).map(i => (
            <div key={i.ID} style={{ padding:'10px 0', borderBottom:'1px solid var(--surface-border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.875rem', fontWeight:500, color:'var(--text-primary)', lineHeight:1.5 }}>
                  {i.CODIGO && <span className="prod-tag">{i.CODIGO}</span>}
                  {i.DESCRICAO}
                </div>
                <div style={{ fontSize:'.72rem', color:'var(--s-500)', marginTop:3 }}>Qtd: {formatQtd(i.QUANTIDADE)} × {formatMoeda(i.PRECO_UNIT)}</div>
              </div>
              <div style={{ fontWeight:700, fontFamily:'var(--font-condensed)', color:'var(--amber)', fontSize:'.9rem', flexShrink:0 }}>{formatMoeda(i.TOTAL)}</div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => { setModalVerPedido(false); setModalImportar(true); }}>← Voltar</button>
          <button className="btn btn-primary" onClick={confirmarImportacao}><IcDownload /> Importar</button>
        </div>
      </Modal>
      {/* ── Modal: Confirmar ação genérica ───────────────────── */}
      <Modal open={!!modalConfirm} onClose={() => setModalConfirm(null)} center>
        <div style={{ padding:'28px 24px 20px', textAlign:'center' }}>
          <div style={{ width:44, height:44, background:'var(--danger-bg)', border:'1px solid var(--danger-border)', borderRadius:'var(--r-full)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
          <p style={{ fontSize:'.9rem', fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>{modalConfirm?.msg}</p>
          <p style={{ fontSize:'.78rem', color:'var(--s-500)', marginBottom:20 }}>Esta ação não pode ser desfeita.</p>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" style={{ flex:1, padding:'11px', borderRadius:'var(--r-lg)' }} onClick={() => setModalConfirm(null)}>
              Cancelar
            </button>
            <button className={`btn ${modalConfirm?.okClass || 'btn-danger'}`} style={{ flex:1, padding:'11px', borderRadius:'var(--r-lg)' }}
              onClick={() => { modalConfirm?.onOk(); setModalConfirm(null); }}>
              {modalConfirm?.okLabel || 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
