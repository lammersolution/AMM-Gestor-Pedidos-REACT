# AMM Gestor de Pedidos — React + Node.js

Conversão completa do projeto PHP/Firebird para **React (Vite)** no frontend e **Node.js (Express)** no backend.

---

## 🗂 Estrutura do Projeto

```
amm-gestor/
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── db/
│   │   │   └── firebird.js   # Conexão com Firebird via node-firebird
│   │   ├── middleware/
│   │   │   └── auth.js       # requireAuth, currentUser
│   │   ├── routes/
│   │   │   ├── auth.js       # POST /api/auth/login, logout, GET /me
│   │   │   └── api.js        # Clientes, Produtos, Pedidos, Itens
│   │   └── server.js         # Express app + sessão + CORS
│   ├── .env.example          # Variáveis de ambiente
│   └── package.json
│
├── frontend/                 # React + Vite
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx   # Login/logout/sessão
│   │   │   └── ToastContext.jsx  # Notificações
│   │   ├── components/
│   │   │   ├── Modal.jsx
│   │   │   └── Topbar.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Tela de login (senha numérica)
│   │   │   ├── Dashboard.jsx     # Nova Venda (tela principal)
│   │   │   └── Pedidos.jsx       # Histórico de pedidos
│   │   ├── utils/
│   │   │   ├── api.js            # Axios configurado
│   │   │   └── format.js        # formatMoeda, formatData, etc.
│   │   ├── styles/
│   │   │   └── global.css        # CSS original migrado
│   │   ├── App.jsx               # Rotas React Router
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── package.json              # Scripts raiz
```

---

## ⚙️ Pré-requisitos

- **Node.js 18+**
- **Firebird 2.5+** rodando localmente na porta 3050
- **node-firebird** depende do `fbclient.dll` (Windows) ou `libfbclient.so` (Linux)

---

## 🚀 Instalação e Execução

### 1. Instalar dependências

```bash
# Na raiz do projeto
npm run install:all

# Ou manualmente:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar o backend

```bash
cd backend
cp .env.example .env
# Edite o .env com os dados do seu banco Firebird
```

Exemplo de `.env`:
```
DB_HOST=localhost
DB_PORT=3050
DB_DATABASE=C:\Lammer\Dados\DADOS.ARMARINHOJULIANA.FDB
DB_USER=SYSDBA
DB_PASSWORD=masterkey
SESSION_SECRET=mude_esta_chave_em_producao
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Iniciar os servidores

```bash
# Terminal 1 — Backend (porta 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🔌 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login por senha (compatível com XOR legado Delphi) |
| POST | `/api/auth/logout` | Encerra sessão |
| GET  | `/api/auth/me` | Usuário logado |

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clientes?q=texto` | Autocomplete de clientes |
| GET | `/api/clientes` (sem q) | Lista completa |
| POST | `/api/clientes` | Cadastra novo cliente |

### Produtos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/produtos/buscar?q=texto` | Busca produtos |
| GET | `/api/produtos?offset=0` | Lista paginada (60/vez) |

### Pedidos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/pedidos` | Lista pedidos do vendedor |
| POST | `/api/pedidos/item` | Adiciona item (cria pedido se necessário) |
| PUT  | `/api/pedidos/item/:id` | Atualiza quantidade |
| DELETE | `/api/pedidos/item/:id` | Remove item (soft delete) |
| POST | `/api/pedidos/:id/cancelar` | Cancela pedido |
| POST | `/api/pedidos/:id/concluir` | Conclui pedido (draft → pending) |
| GET  | `/api/pedidos/:id/itens` | Itens de um pedido |
| GET  | `/api/pedidos/para-importar` | Pedidos disponíveis para importação |
| POST | `/api/pedidos/importar` | Importa itens de pedido anterior |

---

## 🔐 Autenticação Legado

O sistema mantém **compatibilidade total** com as senhas do banco Delphi legado:

1. **XOR 10** — senhas criptografadas no padrão Delphi (principal)
2. **Texto plano** — fallback para registros sem criptografia
3. **bcrypt** — pronto para migração futura

A função `xorCripta()` em `backend/src/routes/auth.js` é equivalente exata da função Delphi original.

---

## 🏗 Banco de Dados

O projeto usa **Firebird** via `node-firebird`. As tabelas acessadas são as mesmas do projeto PHP original:

- `USUARIOS` — usuários do sistema (tabela legado)
- `CONTATO` — clientes
- `PRODUTOS` — catálogo de produtos
- `GP_PEDIDOS` — pedidos master
- `GP_PEDIDO_ITENS` — itens de pedido

---

## 📦 Build para Produção

```bash
# Gerar build do frontend
cd frontend
npm run build
# Os arquivos ficam em frontend/dist/

# Servir os arquivos estáticos via Express
# Adicione ao server.js:
# app.use(express.static(path.join(__dirname, '../../frontend/dist')));
```

---

## 🔄 Diferenças em relação ao PHP Original

| PHP Original | React + Node.js |
|---|---|
| Sessão no servidor (PHP session) | Express-session (cookie httpOnly) |
| PDO Firebird | node-firebird |
| HTML + PHP misturado | Componentes React separados |
| `api.php` com switch/case | Express Router com REST API |
| Manipulação DOM manual | Estado React declarativo |
| Arquivos `.php` separados | SPA com React Router |

---

## 🛠 Solução de Problemas

**Erro de conexão com Firebird:**
- Verifique se o serviço Firebird está rodando (porta 3050)
- Confirme o caminho do `.fdb` no `.env`
- No Windows, `fbclient.dll` deve estar no PATH do sistema ou na pasta do Node.js

**CORS:**
- Certifique-se que `FRONTEND_URL` no `.env` aponta para a porta correta do Vite

**Sessão expirando:**
- Ajuste `SESSION_LIFETIME_HOURS` no `.env` (padrão: 8 horas)
