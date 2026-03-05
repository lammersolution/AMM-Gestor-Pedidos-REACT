/**
 * AMM Gestor - Rotas da API de Pedidos (dashboard principal)
 */
const express = require('express');
const router  = express.Router();
const { query, transaction, nextId } = require('../db/firebird');
const { requireAuth, currentUser }   = require('../middleware/auth');

router.use(requireAuth);

// ── Buscar clientes (autocomplete) ──────────────────────────
router.get('/clientes/buscar', async (req, res) => {
  const { q = '' } = req.query;
  const like = `%${q}%`;
  try {
    let rows;
    try {
      rows = await query(`
        SELECT FIRST 20
          C.ID,
          CAST(C.ID AS VARCHAR(20)) AS CODIGO,
          C.NOME,
          COALESCE(C.TELEFONE, '') AS TELEFONE
        FROM CONTATO C
        WHERE C.ATIVO = 'T'
          AND (UPPER(C.NOME) LIKE UPPER(?) OR UPPER(CAST(C.ID AS VARCHAR(20))) LIKE UPPER(?))
        ORDER BY C.NOME
      `, [like, like]);
    } catch {
      rows = await query(`
        SELECT FIRST 20
          IDCLIENTE AS ID,
          CAST(IDCLIENTE AS VARCHAR(20)) AS CODIGO,
          CLIENTE AS NOME,
          '' AS TELEFONE
        FROM GP_PEDIDOS
        WHERE UPPER(CLIENTE) LIKE UPPER(?)
        GROUP BY IDCLIENTE, CLIENTE
        ORDER BY CLIENTE
      `, [like]);
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Listar todos os clientes (modal) ────────────────────────
router.get('/clientes', async (req, res) => {
  try {
    let rows;
    try {
      rows = await query(`
        SELECT C.ID, CAST(C.ID AS VARCHAR(20)) AS CODIGO, C.NOME, COALESCE(C.TELEFONE,'') AS TELEFONE
        FROM CONTATO C WHERE C.ATIVO = 'T' ORDER BY C.NOME
      `);
    } catch {
      rows = await query(`
        SELECT FIRST 300 IDCLIENTE AS ID, CAST(IDCLIENTE AS VARCHAR(20)) AS CODIGO, CLIENTE AS NOME, '' AS TELEFONE
        FROM GP_PEDIDOS GROUP BY IDCLIENTE, CLIENTE ORDER BY CLIENTE
      `);
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Cadastrar novo cliente ───────────────────────────────────
router.post('/clientes', async (req, res) => {
  const { nome } = req.body;
  if (!nome || nome.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Informe o nome do cliente.' });
  }
  try {
    const novoId = await nextId('CONTATO_ID');
    await query(`INSERT INTO CONTATO (ID, NOME, ATIVO, DATA_CAD) VALUES (?, ?, 'T', CURRENT_TIMESTAMP)`, [novoId, nome.trim()]);
    res.json({ success: true, cliente: { ID: novoId, CODIGO: String(novoId), NOME: nome.trim() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Buscar produtos (autocomplete) ──────────────────────────
router.get('/produtos/buscar', async (req, res) => {
  const { q = '' } = req.query;
  const like = `%${q}%`;
  try {
    let rows;
    try {
      rows = await query(`
        SELECT FIRST 40 P.ID, P.EAN AS CODIGO, P.DESCRICAO, P.UNIDADE, P.PRECO, 0 AS FRACIONADO
        FROM PRODUTOS P
        WHERE P.ATIVO = 'T' AND (UPPER(P.DESCRICAO) LIKE UPPER(?) OR UPPER(P.EAN) LIKE UPPER(?))
        ORDER BY P.DESCRICAO
      `, [like, like]);
    } catch {
      rows = await query(`
        SELECT FIRST 40 IDPRODUTO AS ID, EANPRODUTO AS CODIGO, DESCPRODUTO AS DESCRICAO, 'UN' AS UNIDADE, VALOR AS PRECO, 1 AS FRACIONADO
        FROM GP_PEDIDO_ITENS
        WHERE UPPER(DESCPRODUTO) LIKE UPPER(?) OR UPPER(EANPRODUTO) LIKE UPPER(?)
        GROUP BY IDPRODUTO, EANPRODUTO, DESCPRODUTO, VALOR ORDER BY DESCPRODUTO
      `, [like, like]);
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Listar produtos (paginado) ───────────────────────────────
router.get('/produtos', async (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset || '0'));
  const limit  = 60;
  try {
    let rows;
    try {
      rows = await query(`
        SELECT FIRST ${limit} SKIP ${offset} P.ID, P.EAN AS CODIGO, P.DESCRICAO, P.UNIDADE, P.PRECO, 0 AS FRACIONADO
        FROM PRODUTOS P WHERE P.ATIVO = 'T' ORDER BY P.DESCRICAO
      `);
    } catch {
      rows = await query(`
        SELECT FIRST ${limit} SKIP ${offset} IDPRODUTO AS ID, EANPRODUTO AS CODIGO, DESCPRODUTO AS DESCRICAO, 'UN' AS UNIDADE, VALOR AS PRECO, 1 AS FRACIONADO
        FROM GP_PEDIDO_ITENS GROUP BY IDPRODUTO, EANPRODUTO, DESCPRODUTO, VALOR ORDER BY DESCPRODUTO
      `);
    }
    res.json({ success: true, data: rows, hasMore: rows.length === limit, offset: offset + rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Listar pedidos para importação ───────────────────────────
// IMPORTANTE: esta rota deve vir ANTES de /pedidos/:pedidoId/...
// para evitar que "para-importar" seja interpretado como um ID
router.get('/pedidos/para-importar', async (req, res) => {
  const user  = currentUser(req);
  const fidId = user.id_funcionario;
  try {
    const rows = await query(`SELECT FIRST 50 ID, STATUS, VALORTOTAL AS TOTAL, CREATED_AT AS CRIADO_EM, CLIENTE AS CLIENTE_NOME FROM GP_PEDIDOS WHERE IDVENDEDOR=? AND STATUS <> 'completed' ORDER BY ID DESC`, [fidId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Adicionar item ao pedido ─────────────────────────────────
router.post('/pedidos/item', async (req, res) => {
  const user = currentUser(req);
  const fidId = user.id_funcionario;
  const nome  = user.nome;

  const {
    pedido_id, cliente_id, cliente_nome,
    produto_id, produto_ean, produto_desc, produto_un,
    preco, quantidade
  } = req.body;

  let pedidoId   = parseInt(pedido_id || '0');
  const clienteId  = parseInt(cliente_id);
  const clienteNome = String(cliente_nome || '');
  const precoVal = parseFloat(preco);
  const qtd      = parseFloat(quantidade);

  if (!clienteId || !(qtd > 0) || !(precoVal >= 0)) {
    return res.status(400).json({ success: false, message: 'Dados inválidos.' });
  }

  try {
    const result = await transaction(async (q) => {
      // Cria pedido se não existir
      if (!pedidoId) {
        pedidoId = await nextId('GEN_GP_PEDIDOS_ID');
        await q(`
          INSERT INTO GP_PEDIDOS (ID, DATALANCAMENTO, IDCLIENTE, CLIENTE, IDVENDEDOR, VENDEDOR, VALOR, DESCONTO, ACRESCIMO, VALORTOTAL, CREATED_AT, STATUS)
          VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 0, 0, 0, 0, CURRENT_TIMESTAMP, 'draft')
        `, [pedidoId, clienteId, clienteNome, fidId, nome]);
      }

      const novoItemId  = await nextId('GEN_GP_PEDIDO_ITENS_ID');
      const itemTotal   = Math.round(qtd * precoVal * 100) / 100;

      await q(`
        INSERT INTO GP_PEDIDO_ITENS (ID, IDPEDIDO, DATALANCAMENTO, IDCLIENTE, IDVENDEDOR, IDPRODUTO, EANPRODUTO, DESCPRODUTO, VALOR, QUANTIDADE, DESCONTO, ACRESCIMO, VALORTOTAL, CANCELADO, CREATED_AT)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'N', CURRENT_TIMESTAMP)
      `, [novoItemId, pedidoId, clienteId, fidId, parseInt(produto_id || '0'), produto_ean || '', produto_desc, precoVal, qtd, itemTotal]);

      // Recalcula total
      await q(`
        UPDATE GP_PEDIDOS SET
          VALORTOTAL = (SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')),
          VALOR      = (SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N'))
        WHERE ID=?
      `, [pedidoId, pedidoId, pedidoId]);

      const [pedido] = await q(`SELECT VALORTOTAL AS TOTAL FROM GP_PEDIDOS WHERE ID=?`, [pedidoId]);

      return {
        pedido_id: pedidoId,
        item: {
          ID:         novoItemId,
          CODIGO:     produto_ean || '',
          DESCRICAO:  produto_desc,
          UNIDADE:    produto_un || 'UN',
          QUANTIDADE: qtd,
          PRECO_UNIT: precoVal,
          TOTAL:      itemTotal,
        },
        total: pedido?.TOTAL || pedido?.total || 0,
      };
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Atualizar quantidade de item ─────────────────────────────
router.put('/pedidos/item/:itemId', async (req, res) => {
  const user  = currentUser(req);
  const fidId = user.id_funcionario;
  const itemId = parseInt(req.params.itemId);
  const qtd    = parseFloat(req.body.quantidade);

  if (!itemId || !(qtd > 0)) return res.status(400).json({ success: false, message: 'Dados inválidos.' });

  try {
    const rows = await query(`
      SELECT I.ID, I.IDPEDIDO, I.VALOR FROM GP_PEDIDO_ITENS I
      INNER JOIN GP_PEDIDOS P ON P.ID = I.IDPEDIDO
      WHERE I.ID=? AND P.IDVENDEDOR=? AND P.STATUS IN ('draft','pending') AND (I.CANCELADO IS NULL OR I.CANCELADO='N')
    `, [itemId, fidId]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Item não encontrado.' });

    const item      = rows[0];
    const pedidoId  = item.IDPEDIDO || item.idpedido;
    const valor     = parseFloat(item.VALOR || item.valor || 0);
    const itemTotal = Math.round(qtd * valor * 100) / 100;

    await query(`UPDATE GP_PEDIDO_ITENS SET QUANTIDADE=?, VALORTOTAL=? WHERE ID=?`, [qtd, itemTotal, itemId]);
    await query(`
      UPDATE GP_PEDIDOS SET
        VALORTOTAL=(SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')),
        VALOR=(SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N'))
      WHERE ID=?
    `, [pedidoId, pedidoId, pedidoId]);

    const [pedido] = await query(`SELECT VALORTOTAL AS TOTAL FROM GP_PEDIDOS WHERE ID=?`, [pedidoId]);

    res.json({ success: true, item_total: itemTotal, pedido_total: pedido?.TOTAL || pedido?.total || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Excluir item (soft delete) ───────────────────────────────
router.delete('/pedidos/item/:itemId', async (req, res) => {
  const user   = currentUser(req);
  const fidId  = user.id_funcionario;
  const itemId = parseInt(req.params.itemId);

  try {
    const rows = await query(`
      SELECT I.ID, I.IDPEDIDO FROM GP_PEDIDO_ITENS I
      INNER JOIN GP_PEDIDOS P ON P.ID=I.IDPEDIDO
      WHERE I.ID=? AND P.IDVENDEDOR=? AND P.STATUS IN ('draft','pending')
    `, [itemId, fidId]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Item não encontrado.' });

    const pedidoId = rows[0].IDPEDIDO || rows[0].idpedido;
    await query(`UPDATE GP_PEDIDO_ITENS SET CANCELADO='S' WHERE ID=?`, [itemId]);
    await query(`
      UPDATE GP_PEDIDOS SET
        VALORTOTAL=(SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')),
        VALOR=(SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N'))
      WHERE ID=?
    `, [pedidoId, pedidoId, pedidoId]);

    const [pedido] = await query(`SELECT VALORTOTAL AS TOTAL FROM GP_PEDIDOS WHERE ID=?`, [pedidoId]);
    res.json({ success: true, pedido_total: pedido?.TOTAL || pedido?.total || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Cancelar pedido ──────────────────────────────────────────
router.post('/pedidos/:pedidoId/cancelar', async (req, res) => {
  const user    = currentUser(req);
  const pedidoId = parseInt(req.params.pedidoId);

  try {
    await query(`UPDATE GP_PEDIDO_ITENS SET CANCELADO='S' WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')`, [pedidoId]);
    await query(`UPDATE GP_PEDIDOS SET STATUS='cancelled', VALORTOTAL=0, VALOR=0 WHERE ID=? AND IDVENDEDOR=? AND STATUS IN ('draft','pending')`, [pedidoId, user.id_funcionario]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Concluir pedido ──────────────────────────────────────────
router.post('/pedidos/:pedidoId/concluir', async (req, res) => {
  const user    = currentUser(req);
  const pedidoId = parseInt(req.params.pedidoId);

  try {
    const [cnt] = await query(`SELECT COUNT(*) AS QTD FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')`, [pedidoId]);
    if (!(parseInt(cnt?.QTD || cnt?.qtd || 0) > 0)) {
      return res.status(400).json({ success: false, message: 'O pedido não possui itens.' });
    }
    await query(`UPDATE GP_PEDIDOS SET STATUS='pending', DATALANCAMENTO=CURRENT_TIMESTAMP WHERE ID=? AND IDVENDEDOR=? AND STATUS='draft'`, [pedidoId, user.id_funcionario]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Listar pedidos (histórico) ───────────────────────────────
router.get('/pedidos', async (req, res) => {
  const user  = currentUser(req);
  const fidId = user.id_funcionario;
  const { status, busca, dt_inicio, dt_fim } = req.query;

  let sql    = `SELECT P.ID, P.STATUS, P.VALORTOTAL AS TOTAL, P.CREATED_AT AS CRIADO_EM, P.CLIENTE AS CLIENTE_NOME, P.IDCLIENTE FROM GP_PEDIDOS P WHERE P.IDVENDEDOR=?`;
  const params = [fidId];

  if (status) { sql += ` AND P.STATUS=?`; params.push(status); }
  if (busca)  { sql += ` AND UPPER(P.CLIENTE) LIKE UPPER(?)`; params.push(`%${busca}%`); }
  if (dt_inicio) { sql += ` AND CAST(P.CREATED_AT AS DATE) >= ?`; params.push(dt_inicio); }
  if (dt_fim)    { sql += ` AND CAST(P.CREATED_AT AS DATE) <= ?`; params.push(dt_fim); }

  sql += ` ORDER BY P.ID DESC`;

  try {
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Ver itens de um pedido ───────────────────────────────────
router.get('/pedidos/:pedidoId/itens', async (req, res) => {
  const user    = currentUser(req);
  const pedidoId = parseInt(req.params.pedidoId);

  try {
    const [pedido] = await query(`SELECT ID, CLIENTE AS CLIENTE_NOME, VALORTOTAL AS TOTAL, DATALANCAMENTO AS DATA FROM GP_PEDIDOS WHERE ID=?`, [pedidoId]);
    const itens    = await query(`SELECT ID, EANPRODUTO AS CODIGO, DESCPRODUTO AS DESCRICAO, QUANTIDADE, VALOR AS PRECO_UNIT, VALORTOTAL AS TOTAL FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N') ORDER BY ID`, [pedidoId]);
    res.json({ success: true, pedido, itens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Importar itens de pedido anterior ────────────────────────
router.post('/pedidos/importar', async (req, res) => {
  const user    = currentUser(req);
  const fidId   = user.id_funcionario;
  const nome    = user.nome;
  const { pedido_origem_id, cliente_id, cliente_nome } = req.body;
  const origemId   = parseInt(pedido_origem_id);
  const clienteId  = parseInt(cliente_id);
  const clienteNome = String(cliente_nome || '');

  if (!origemId || !clienteId) return res.status(400).json({ success: false, message: 'Dados inválidos.' });

  try {
    const orig = await query(`SELECT ID FROM GP_PEDIDOS WHERE ID=? AND IDVENDEDOR=?`, [origemId, fidId]);
    if (!orig.length) return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });

    const novoPedidoId = await nextId('GEN_GP_PEDIDOS_ID');
    await query(`INSERT INTO GP_PEDIDOS (ID, DATALANCAMENTO, IDCLIENTE, CLIENTE, IDVENDEDOR, VENDEDOR, VALOR, DESCONTO, ACRESCIMO, VALORTOTAL, CREATED_AT, STATUS) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 0, 0, 0, 0, CURRENT_TIMESTAMP, 'draft')`,
      [novoPedidoId, clienteId, clienteNome, fidId, nome]);

    const itens = await query(`SELECT * FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')`, [origemId]);
    for (const it of itens) {
      const novoItemId  = await nextId('GEN_GP_PEDIDO_ITENS_ID');
      const qtd         = parseFloat(it.QUANTIDADE || it.quantidade || 0);
      const valor       = parseFloat(it.VALOR      || it.valor      || 0);
      const itemTotal   = Math.round(qtd * valor * 100) / 100;
      await query(`INSERT INTO GP_PEDIDO_ITENS (ID, IDPEDIDO, DATALANCAMENTO, IDCLIENTE, IDVENDEDOR, IDPRODUTO, EANPRODUTO, DESCPRODUTO, VALOR, QUANTIDADE, DESCONTO, ACRESCIMO, VALORTOTAL, CANCELADO, CREATED_AT) VALUES (?,?,CURRENT_TIMESTAMP,?,?,?,?,?,?,?,0,0,?,'N',CURRENT_TIMESTAMP)`,
        [novoItemId, novoPedidoId, clienteId, fidId, parseInt(it.IDPRODUTO||it.idproduto||0), it.EANPRODUTO||it.eanproduto||'', it.DESCPRODUTO||it.descproduto||'', valor, qtd, itemTotal]);
    }

    await query(`UPDATE GP_PEDIDOS SET VALORTOTAL=(SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')), VALOR=(SELECT COALESCE(SUM(VALORTOTAL),0) FROM GP_PEDIDO_ITENS WHERE IDPEDIDO=? AND (CANCELADO IS NULL OR CANCELADO='N')) WHERE ID=?`, [novoPedidoId, novoPedidoId, novoPedidoId]);

    res.json({ success: true, pedido_id: novoPedidoId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
