# MedShare Backend

Backend da aplicação MedShare - API REST para compartilhamento seguro de informações médicas pessoais.

**Projeto acadêmico desenvolvido para a PUCRS**

## 📋 Sobre o Projeto

O MedShare Backend é uma API robusta construída com Node.js e Express.js que oferece:

- ✅ **Autenticação JWT** segura
- ✅ **Criptografia AES-256** para dados médicos
- ✅ **Links públicos** com QR Code para emergências
- ✅ **Rate limiting** e validações rigorosas
- ✅ **Sistema completo** de usuários e perfis médicos

## 🛠️ Tecnologias Utilizadas

- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Crypto (AES-256)** - Criptografia de dados
- **QRCode** - Geração de códigos QR
- **Nodemailer** - Envio de emails
- **Helmet** - Segurança HTTP

## 📁 Estrutura do Projeto

```
src/
├── config/
│   └── database.js          # Conexão MySQL
├── controllers/             # Lógica de negócio
│   ├── authController.js
│   ├── userController.js
│   ├── medicalController.js
│   ├── emergencyContactController.js
│   └── publicController.js
├── middleware/              # Middlewares
│   ├── auth.js             # Verificação JWT
│   ├── validation.js       # Validações
│   └── errorMiddleware.js
├── routes/                 # Definição de rotas
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── medicalRoutes.js
│   ├── emergencyContactRoutes.js
│   └── publicRoutes.js
├── utils/                  # Utilitários
│   ├── encryption.js       # Criptografia AES-256
│   └── emailService.js     # Serviço de email
└── server.js              # Entrada da aplicação
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- MySQL 8.0+ instalado e rodando
- npm ou yarn

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

**Criar o banco:**
```sql
CREATE DATABASE medshare;
```

**Executar o script SQL:**
```bash
# Opção 1: Via linha de comando
mysql -u root -p medshare < ../database_schema.sql

# Opção 2: Via MySQL Workbench ou phpMyAdmin
# Importe o arquivo database_schema.sql na raiz do projeto
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp env.example .env
```

Configure o arquivo `.env`:
```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=medshare

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
JWT_EXPIRES_IN=24h

# Criptografia (será gerada automaticamente)
ENCRYPTION_KEY=

# Email (configurar se quiser usar recuperação de senha)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua_senha_de_app

# Frontend (para CORS)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000
```

### 4. Gerar Chaves de Criptografia

```bash
node generate-keys.js
```

Este comando irá gerar uma chave AES-256 segura e atualizar automaticamente o arquivo `.env`.

### 5. Executar a Aplicação

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

A API estará disponível em: `http://localhost:3001`

## 📚 Endpoints da API

### 🔐 Autenticação
```
POST /api/auth/register      # Cadastro de usuário
POST /api/auth/login         # Login
POST /api/auth/forgot-password   # Recuperar senha
POST /api/auth/reset-password    # Resetar senha
```

### 👤 Usuário
```
GET  /api/users/profile      # Buscar perfil
PUT  /api/users/profile      # Atualizar perfil
PUT  /api/users/password     # Alterar senha
DELETE /api/users/account    # Deletar conta
```

### 🏥 Informações Médicas (Criptografadas)
```
GET  /api/medical/info       # Buscar informações
PUT  /api/medical/info       # Atualizar informações
DELETE /api/medical/clear    # Limpar informações
```

### 📞 Contatos de Emergência
```
GET  /api/emergency-contacts     # Listar contatos
POST /api/emergency-contacts     # Criar contato
PUT  /api/emergency-contacts/:id # Atualizar contato
DELETE /api/emergency-contacts/:id # Deletar contato
```

### 🔗 Link Público
```
GET  /api/users/public-link      # Info do link
POST /api/users/generate-public-link # Gerar/atualizar link
DELETE /api/users/disable-public-link # Desativar link
GET  /api/users/qr-code          # Download QR Code
```

### 🌐 Acesso Público (Sem Autenticação)
```
GET  /api/public/check/:uuid     # Verificar se link existe
POST /api/public/access/:uuid    # Acessar com senha
GET  /api/public/profile/:uuid   # Buscar perfil público
```

## 🗄️ Banco de Dados

O projeto utiliza MySQL com 3 tabelas principais:

### `users` - Usuários do sistema
- Dados pessoais (nome, email, telefone, etc.)
- Senha hasheada com bcrypt
- Chave de criptografia única por usuário
- Configurações do link público

### `medical_info` - Informações médicas (criptografadas)
- Tipo sanguíneo
- Alergias
- Medicamentos
- Doenças
- Cirurgias realizadas

### `emergency_contacts` - Contatos de emergência
- Nome e relação com o usuário
- Telefone e email para contato

## 🔒 Segurança

### Criptografia
- **AES-256-CBC** para dados médicos sensíveis
- **Chaves únicas** por usuário (256 bits)
- **IVs aleatórios** para cada registro
- **BCrypt** para senhas (salt rounds configurável)

### Autenticação
- **JWT tokens** com expiração
- **Middleware de autenticação** em rotas protegidas
- **Rate limiting** global e por rota
- **Validação e sanitização** de inputs

### Headers de Segurança (Helmet)
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS para HTTPS

## 🧪 Testando a API

### Exemplo: Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@email.com", "senha": "minhasenha"}'
```

### Exemplo: Buscar perfil (autenticado)
```bash
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI"
```

### Exemplo: Verificar link público
```bash
curl http://localhost:3001/api/public/check/uuid-do-link-publico
```

## 📦 Scripts Disponíveis

```bash
npm start              # Executar em produção
npm run dev            # Executar com nodemon (desenvolvimento)
npm run generate-keys  # Gerar chaves de criptografia
```

## 🔧 Configuração para Produção

### Variáveis importantes para produção:
```env
NODE_ENV=production
JWT_SECRET=chave_complexa_e_unica_em_producao
ENCRYPTION_KEY=chave_256_bits_diferente_da_dev
DB_HOST=seu_host_de_producao
FRONTEND_URL=https://seu-dominio.com
```

### PM2 (Recomendado):
```bash
npm install -g pm2
pm2 start src/server.js --name "medshare-api"
pm2 startup
pm2 save
```

## 📝 Logs e Monitoramento

A aplicação gera logs detalhados de:
- Requisições HTTP (Morgan)
- Erros de sistema
- Tentativas de acesso a links públicos
- Falhas de autenticação

## 🐛 Troubleshooting

### Erro de conexão com MySQL:
1. Verifique se o MySQL está rodando
2. Confirme as credenciais no `.env`
3. Teste a conexão: `mysql -u root -p`

### Erro "ENCRYPTION_KEY not found":
```bash
node generate-keys.js
```

### Erro de CORS:
Verifique a variável `CORS_ORIGIN` no `.env`

## 👥 Equipe

- **Desenvolvedor**: Nicholas Francatti
- **Projeto Acadêmico**: PUCRS

