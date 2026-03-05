/**
 * AMM Gestor - Rotas de Autenticação
 * 
 * Mantém compatibilidade com criptografia XOR legado do Delphi (chave=10)
 */
const express = require('express');
const router  = express.Router();
const { query } = require('../db/firebird');
const { requireAuth, currentUser } = require('../middleware/auth');

/**
 * XOR byte a byte — equivalente ao Delphi Criptografa(texto, chave=10)
 */
function xorCripta(texto, chave = 10) {
  let resultado = '';
  for (let i = 0; i < texto.length; i++) {
    resultado += String.fromCharCode(texto.charCodeAt(i) ^ chave);
  }
  return resultado;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { senha } = req.body;
    if (!senha) {
      return res.status(400).json({ success: false, message: 'Informe a senha.' });
    }

    const usuarios = await query(`
      SELECT ID, USUARIO, SENHA, NOME_USUAIO, ID_FUNCIONARIO, TIPO_USUARIO
      FROM USUARIOS
      WHERE ATIVO = 'T'
    `);

    const senhaCriptografada = xorCripta(senha, 10);

    for (const u of usuarios) {
      const senhaBanco = String(u.SENHA || u.senha || '').trim();
      let senhaCorreta = false;

      // 1. XOR 10 (banco Delphi legado)
      if (senhaCriptografada === senhaBanco) {
        senhaCorreta = true;
      }
      // 2. Texto plano (fallback)
      else if (senha === senhaBanco) {
        senhaCorreta = true;
      }

      if (senhaCorreta) {
        const nomeField  = u.NOME_USUAIO  || u.nome_usuaio  || u.USUARIO || u.usuario || '';
        const loginField = u.USUARIO      || u.usuario      || '';
        const idFunc     = u.ID_FUNCIONARIO || u.id_funcionario || 0;
        const tipoUser   = u.TIPO_USUARIO   || u.tipo_usuario   || 0;
        const userId     = u.ID || u.id;

        req.session.usuario_id     = userId;
        req.session.usuario_nome   = String(nomeField).trim();
        req.session.usuario_login  = String(loginField).trim();
        req.session.id_funcionario = parseInt(idFunc);
        req.session.tipo_usuario   = parseInt(tipoUser);

        return res.json({
          success: true,
          usuario: {
            id:             userId,
            nome:           String(nomeField).trim(),
            usuario:        String(loginField).trim(),
            id_funcionario: parseInt(idFunc),
            tipo:           parseInt(tipoUser),
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Senha incorreta. Tente novamente.' });
  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Erro de conexão com o banco.', detalhe: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('amm_sid'); // mesmo nome definido em server.js (name: 'amm_sid')
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, usuario: currentUser(req) });
});

module.exports = router;
