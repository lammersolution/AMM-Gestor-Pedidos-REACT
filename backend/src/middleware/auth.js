/**
 * AMM Gestor - Middleware de Autenticação
 */

function requireAuth(req, res, next) {
  if (req.session?.usuario_id) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Sessão expirada.' });
}

function currentUser(req) {
  return {
    id:             req.session.usuario_id     || 0,
    nome:           req.session.usuario_nome   || '',
    usuario:        req.session.usuario_login  || '',
    id_funcionario: req.session.id_funcionario || 0,
    tipo:           req.session.tipo_usuario   || 0,
  };
}

module.exports = { requireAuth, currentUser };
