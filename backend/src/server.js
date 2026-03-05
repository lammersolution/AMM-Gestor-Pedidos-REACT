/**
 * AMM Gestor de Pedidos — Servidor Node.js/Express
 */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors    = require('cors');

const authRoutes = require('./routes/auth');
const apiRoutes  = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

// ── CORS — aceita qualquer IP da rede local ────────────────
// Em produção defina FRONTEND_URL com o IP fixo do servidor
app.use(cors({
  origin: function (origin, callback) {
    // Sem origin = apps nativos, Postman, curl — permite
    if (!origin) return callback(null, true);

    const allowed = process.env.FRONTEND_URL;

    // Se definiu URL específica, só ela
    if (allowed && allowed !== '*') {
      return callback(null, origin === allowed);
    }

    // Permite qualquer origem na rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocal =
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      /^https?:\/\/192\.168\./.test(origin) ||
      /^https?:\/\/10\./.test(origin) ||
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./.test(origin);

    callback(null, isLocal);
  },
  credentials: true,
}));

// ── Body parsers ───────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Sessões ────────────────────────────────────────────────
// Sessões em memória funcionam bem para até ~50 usuários.
// Para mais usuários ou para sobreviver a restart, use connect-session-knex
// ou express-session com store em arquivo/SQLite.
app.use(session({
  name:   'amm_sid',
  secret: process.env.SESSION_SECRET || (() => {
    console.warn('⚠️  SESSION_SECRET não definido no .env — usando chave padrão. Mude em produção!');
    return 'amm_gestor_mude_esta_chave_' + Date.now();
  })(),
  resave: false,
  saveUninitialized: false,
  rolling: true, // renova o cookie a cada request — mantém sessão ativa enquanto usa
  cookie: {
    httpOnly: true,
    secure:   !isDev, // https em produção, http em dev
    sameSite: 'lax',
    maxAge:   (parseInt(process.env.SESSION_LIFETIME_HOURS || '10')) * 3600 * 1000,
  },
}));

// ── Log de requests (dev) ──────────────────────────────────
if (isDev) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
      console.log(`${color}${req.method} ${req.path} ${res.statusCode} ${ms}ms\x1b[0m`);
    });
    next();
  });
}

// ── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api',      apiRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    env: process.env.NODE_ENV || 'development',
  });
});

// ── Servir frontend em produção ────────────────────────────
// IMPORTANTE: deve vir DEPOIS das rotas /api para não interceptá-las
const path = require('path');
const fs   = require('fs');
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Fallback: qualquer rota não-API retorna o index.html (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`📦 Servindo frontend de: ${frontendDist}`);
}

// ── Erro global ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({ success: false, message: 'Erro interno.', detalhe: isDev ? err.message : undefined });
});

// ── Start — escuta em todas as interfaces (0.0.0.0) ────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ AMM Gestor Backend rodando`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Rede:    http://<IP-DO-SERVIDOR>:${PORT}`);
  console.log(`   Env:     ${process.env.NODE_ENV || 'development'}\n`);
});
