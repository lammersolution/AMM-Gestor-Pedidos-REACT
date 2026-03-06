# PROJETO_REFERENCIA — AMM Gestor de Pedidos REACT

> Repositório: https://github.com/lammersolution/AMM-Gestor-Pedidos-REACT  
> Última atualização: 05/03/2026

---

## STATUS ATUAL

✅ Projeto funcionando em produção local  
✅ Tema Lammer Solution aplicado  
✅ Backend Node.js/Express rodando na porta 3001  
✅ Frontend React/Vite builado e servido pelo backend  

---

## STACK

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express + express-session |
| Banco de dados | Firebird (via node-firebird) |
| Frontend | React + Vite |
| Estilo | CSS puro (Design System Lammer Solution) |
| Fontes | Barlow + Barlow Condensed (Google Fonts) |

---

## ESTRUTURA DO PROJETO

```
amm-gestor/
├── backend/
│   ├── src/
│   │   ├── server.js          # Entry point, serve também o frontend/dist
│   │   ├── routes/
│   │   │   ├── api.js         # Rotas: clientes, produtos, pedidos
│   │   │   └── auth.js        # Login por senha única
│   │   ├── middleware/
│   │   │   └── auth.js        # Verificação de sessão
│   │   └── db/
│   │       └── firebird.js    # Conexão com Firebird
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Rotas + Shell (Sidebar, BottomNav)
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx  # Tela principal de pedidos
│   │   │   ├── Pedidos.jsx
│   │   │   ├── Clientes.jsx
│   │   │   └── Produtos.jsx
│   │   ├── components/
│   │   │   ├── Modal.jsx
│   │   │   └── Topbar.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── format.js
│   │   └── styles/
│   │       └── global.css     # Design System Lammer Solution
│   ├── public/
│   │   ├── logo.png
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json
├── .gitignore
├── README.md
└── PROJETO_REFERENCIA.md      # este arquivo
```

---

## COMO RODAR LOCALMENTE

### Pré-requisitos
- Node.js em `C:\Lammer\web\node-v24.14.0-win-x64\`
- Firebird configurado e acessível
- Arquivo `.env` preenchido no backend

### 1. Configurar .env
```powershell
copy C:\Lammer\web\amm-gestor\backend\.env.example C:\Lammer\web\amm-gestor\backend\.env
# Editar .env com as configurações do Firebird
```

### 2. Instalar dependências
```powershell
cd C:\Lammer\web\amm-gestor\backend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd install

cd C:\Lammer\web\amm-gestor\frontend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd install
```

### 3. Build do frontend
```powershell
cd C:\Lammer\web\amm-gestor\frontend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd run build
```

### 4. Rodar o backend
```powershell
cd C:\Lammer\web\amm-gestor\backend
node src/server.js
```

Acesse: **http://localhost:3001**

---

## PROBLEMA COM POWERSHELL (ExecutionPolicy)

Se aparecer erro de script não assinado ao rodar `npm`:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Ou use o `.cmd` diretamente:
```powershell
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd install
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd run build
```

---

## PORTA JÁ EM USO (EADDRINUSE)

Se aparecer erro `listen EADDRINUSE :::3001`:

```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
node src/server.js
```

---

## REGISTRAR COMO SERVIÇO WINDOWS (NSSM)

```powershell
C:\Lammer\tools\nssm.exe install AMMGestor "C:\Lammer\web\node-v24.14.0-win-x64\node.exe"
C:\Lammer\tools\nssm.exe set AMMGestor AppDirectory "C:\Lammer\web\amm-gestor\backend"
C:\Lammer\tools\nssm.exe set AMMGestor AppParameters "src/server.js"
C:\Lammer\tools\nssm.exe start AMMGestor
```

Para gerenciar:
```powershell
C:\Lammer\tools\nssm.exe restart AMMGestor
C:\Lammer\tools\nssm.exe stop AMMGestor
C:\Lammer\tools\nssm.exe status AMMGestor
```

---

## FLUXO DE ATUALIZAÇÃO

```powershell
# 1. Editar arquivos em frontend/src/

# 2. Rebuild
cd C:\Lammer\web\amm-gestor\frontend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd run build

# 3. Reiniciar backend
netstat -ano | findstr :3001
taskkill /PID <PID> /F
cd C:\Lammer\web\amm-gestor\backend
node src/server.js

# 4. Commit
cd C:\Lammer\web\amm-gestor
git add .
git commit -m "feat: descricao da mudanca"
git push
```

---

## TEMA VISUAL — LAMMER SOLUTION

| Variável | Hex | Uso |
|---|---|---|
| `--dark` | `#060e1c` | Background do body |
| `--blue-dark` | `#0a1628` | Cards, modais, inputs |
| `--blue` | `#1a6fc4` | Secundário |
| `--blue-light` | `#4da3e8` | Bordas, ícones ativos |
| `--amber` | `#f5a623` | CTA primário, valores |
| `--amber-dark` | `#d4891a` | Hover do CTA |
| `--white` | `#f0f6ff` | Texto principal |
| `--gray` | `#7a8baa` | Texto secundário |

Fontes: **Barlow Condensed** (títulos/botões) + **Barlow** (corpo)

---

## SESSÕES DO HISTÓRICO

### Sessão 1 — Setup inicial
- Projeto extraído e estruturado
- Git inicializado
- Commit inicial: 31 arquivos

### Sessão 2 — Tema Lammer Solution
- Aplicado Design System Lammer (LAMMER_GUIA_NOVO_PROJETO.md)
- Substituição completa do `global.css`
- Fontes: DM Sans → Barlow / Barlow Condensed
- Paleta: tons neutros → dark/blue-light/amber Lammer
- Botão primário: azul → gradiente âmbar
- Totais/valores: azul → âmbar
- Removido toggle de tema (sempre dark)
- Logo com glow azul sutil
- Commit: `feat: apply Lammer Solution theme`

