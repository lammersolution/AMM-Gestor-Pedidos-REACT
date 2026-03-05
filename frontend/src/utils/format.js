export function formatMoeda(v) {
  const n = parseFloat(v || 0);
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatQtd(n) {
  const f = parseFloat(n);
  return isNaN(f) ? '0,000' : f.toFixed(3).replace('.', ',');
}

export function formatData(str) {
  if (!str) return '';
  const d = new Date(String(str).replace(' ', 'T'));
  return isNaN(d) ? str : d.toLocaleDateString('pt-BR');
}

export function formatDataHora(str) {
  if (!str) return '';
  const d = new Date(String(str).replace(' ', 'T'));
  return isNaN(d) ? str : d.toLocaleString('pt-BR');
}

export const STATUS_LABEL = {
  pending:   'Aberto',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  draft:     'Rascunho',
};

export const STATUS_CLASS = {
  pending:   'badge-open',
  completed: 'badge-done',
  cancelled: 'badge-cancel',
  draft:     'badge-draft',
};
