/**
 * AMM Gestor - Conexão com Firebird via node-firebird
 * Pool de conexões para suportar múltiplos usuários simultâneos
 */
const Firebird = require('node-firebird');
require('dotenv').config();

const options = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3050'),
  database: process.env.DB_DATABASE || 'C:\\Lammer\\Dados\\DADOS.ARMARINHOJULIANA.FDB',
  user:     process.env.DB_USER     || 'SYSDBA',
  password: process.env.DB_PASSWORD || 'masterkey',
  lowercase_keys: false,
  role:     null,
  pageSize: 4096,
  charset:  'WIN1252',
  retryConnectionInterval: 1000, // tenta reconectar a cada 1s se cair
};

// Pool: mínimo 2, máximo 10 conexões simultâneas
// Com 14 usuários cada um fazendo 1-2 req simultâneas, 10 é suficiente
const POOL_MIN = 2;
const POOL_MAX = parseInt(process.env.DB_POOL_MAX || '10');

let pool = null;

function getPool() {
  if (!pool) {
    pool = Firebird.pool(POOL_MAX, options, { min: POOL_MIN });
    console.log(`✅ Pool Firebird criado (min=${POOL_MIN}, max=${POOL_MAX})`);
  }
  return pool;
}

/**
 * Executa uma query usando o pool de conexões.
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Query timeout (15s)')), 15000);

    getPool().get((err, db) => {
      if (err) {
        clearTimeout(timeout);
        return reject(err);
      }
      db.query(sql, params, (err, result) => {
        clearTimeout(timeout);
        db.detach();
        if (err) return reject(err);
        resolve(result || []);
      });
    });
  });
}

/**
 * Executa múltiplas queries numa transação.
 */
function transaction(callback) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Transaction timeout (30s)')), 30000);

    getPool().get((err, db) => {
      if (err) {
        clearTimeout(timeout);
        return reject(err);
      }
      db.transaction(Firebird.ISOLATION_READ_COMMITTED, async (err, tx) => {
        if (err) {
          clearTimeout(timeout);
          db.detach();
          return reject(err);
        }

        const txQuery = (sql, params = []) => new Promise((res, rej) => {
          tx.query(sql, params, (err, result) => {
            if (err) return rej(err);
            res(result || []);
          });
        });

        try {
          const result = await callback(txQuery);
          tx.commit((err) => {
            clearTimeout(timeout);
            db.detach();
            if (err) return reject(err);
            resolve(result);
          });
        } catch (e) {
          tx.rollback(() => {
            clearTimeout(timeout);
            db.detach();
            reject(e);
          });
        }
      });
    });
  });
}

/**
 * Obtém próximo ID via GEN_ID (Firebird 2.5)
 * node-firebird pode retornar o campo em uppercase ou lowercase dependendo da versão/config,
 * por isso verificamos ambos.
 */
async function nextId(sequenceName) {
  const rows = await query(`SELECT GEN_ID(${sequenceName}, 1) AS NOVO_ID FROM RDB$DATABASE`);
  const row = rows[0];
  if (!row) throw new Error(`Não foi possível obter próximo ID para ${sequenceName}`);
  // Trata uppercase (NOVO_ID) e lowercase (novo_id)
  const value = row.NOVO_ID ?? row.novo_id;
  if (value == null) throw new Error(`GEN_ID retornou valor nulo para ${sequenceName}`);
  return value;
}

module.exports = { query, transaction, nextId };
