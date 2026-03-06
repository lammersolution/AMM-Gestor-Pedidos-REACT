# INSTALAÇÃO — AMM Gestor de Pedidos REACT

> Guia completo para instalar e configurar o sistema do zero em um servidor Windows.

---

## PRÉ-REQUISITOS

| Software | Versão | Caminho padrão |
|---|---|---|
| Node.js | v24+ | `C:\Lammer\web\node-v24.14.0-win-x64\` |
| Firebird | 2.5 ou 3.0 | Instalado no servidor |
| Git | qualquer | instalado no sistema |

---

## 1. CLONAR O REPOSITÓRIO

```powershell
cd C:\Lammer\web
git clone https://github.com/lammersolution/AMM-Gestor-Pedidos-REACT.git amm-gestor
```

---

## 2. CONFIGURAR O BACKEND

### 2.1 Instalar dependências
```powershell
cd C:\Lammer\web\amm-gestor\backend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd install
```

### 2.2 Criar o arquivo .env
```powershell
copy .env.example .env
```

Editar o `.env` com as configurações do Firebird:
```env
PORT=3001
NODE_ENV=production

# Firebird
FB_HOST=localhost
FB_PORT=3050
FB_DATABASE=C:\caminho\para\banco.fdb
FB_USER=SYSDBA
FB_PASSWORD=masterkey

# Sessão
SESSION_SECRET=troque_por_uma_chave_segura_aleatoria
SESSION_LIFETIME_HOURS=10

# Senha de acesso ao sistema
APP_PASSWORD=suasenha
```

---

## 3. CONFIGURAR O FRONTEND

### 3.1 Instalar dependências
```powershell
cd C:\Lammer\web\amm-gestor\frontend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd install
```

### 3.2 Gerar o build de produção
```powershell
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd run build
```

Será gerada a pasta `frontend\dist\` que o backend serve automaticamente.

---

## 4. TESTAR MANUALMENTE

```powershell
cd C:\Lammer\web\amm-gestor\backend
node src/server.js
```

Acesse no navegador: **http://localhost:3001**

Deve aparecer a tela de login com o tema Lammer (fundo escuro, logo com glow azul).

---

## 5. REGISTRAR COMO SERVIÇO WINDOWS (NSSM)

Para o sistema iniciar automaticamente com o Windows, sem precisar manter um terminal aberto.

### 5.1 Instalar o serviço
```powershell
C:\Lammer\tools\nssm.exe install AMMGestor "C:\Lammer\web\node-v24.14.0-win-x64\node.exe"
C:\Lammer\tools\nssm.exe set AMMGestor AppDirectory "C:\Lammer\web\amm-gestor\backend"
C:\Lammer\tools\nssm.exe set AMMGestor AppParameters "src/server.js"
C:\Lammer\tools\nssm.exe set AMMGestor DisplayName "AMM Gestor de Pedidos"
C:\Lammer\tools\nssm.exe set AMMGestor Description "Sistema de gestao de pedidos AMM"
C:\Lammer\tools\nssm.exe set AMMGestor Start SERVICE_AUTO_START
```

### 5.2 Iniciar o serviço
```powershell
C:\Lammer\tools\nssm.exe start AMMGestor
```

### 5.3 Verificar status
```powershell
C:\Lammer\tools\nssm.exe status AMMGestor
```

### 5.4 Comandos úteis
```powershell
# Parar
C:\Lammer\tools\nssm.exe stop AMMGestor

# Reiniciar
C:\Lammer\tools\nssm.exe restart AMMGestor

# Remover o serviço
C:\Lammer\tools\nssm.exe remove AMMGestor confirm
```

---

## 6. RESOLUÇÃO DE PROBLEMAS

### ❌ Erro: npm não pode ser carregado (ExecutionPolicy)
```
O arquivo npm.ps1 não está assinado digitalmente
```
**Solução:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Ou use sempre `npm.cmd` no lugar de `npm`:
```powershell
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd install
```

---

### ❌ Erro: Cannot find module 'dotenv'
O `node_modules` não foi instalado ainda.  
**Solução:**
```powershell
cd C:\Lammer\web\amm-gestor\backend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd install
```

---

### ❌ Erro: EADDRINUSE — porta 3001 já em uso
Outro processo já está usando a porta.  
**Solução:**
```powershell
netstat -ano | findstr :3001
taskkill /PID <numero_do_pid> /F
node src/server.js
```

---

### ❌ Frontend sem estilo (CSS não carrega)
O build não foi gerado ou está desatualizado.  
**Solução:**
```powershell
cd C:\Lammer\web\amm-gestor\frontend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd run build
```
Depois reinicie o backend e force reload no navegador com **Ctrl+F5**.

---

### ❌ Erro de conexão com Firebird
Verifique o `.env`:
- `FB_HOST`, `FB_PORT`, `FB_DATABASE`, `FB_USER`, `FB_PASSWORD` corretos
- Serviço do Firebird rodando no servidor
- Caminho do `.fdb` acessível pelo Node.js

---

## 7. ACESSO EM REDE LOCAL

O backend escuta em `0.0.0.0`, ou seja, aceita conexões de qualquer IP da rede.

Para acessar de outro computador na mesma rede:
```
http://<IP-DO-SERVIDOR>:3001
```

Para descobrir o IP do servidor:
```powershell
ipconfig
```
Usar o IPv4 da interface de rede local (ex: `192.168.1.100`).

---

## 8. ATUALIZAR O SISTEMA

Quando houver uma nova versão no GitHub:

```powershell
# 1. Baixar atualizações
cd C:\Lammer\web\amm-gestor
git pull

# 2. Rebuild do frontend
cd frontend
C:\Lammer\web\node-v24.14.0-win-x64\npm.cmd run build

# 3. Reiniciar o serviço
C:\Lammer\tools\nssm.exe restart AMMGestor
```

---

*Lammer Solution — AMM Gestor de Pedidos REACT*
