# API de Autenticação - Nuvelon

## Rotas Disponíveis

### 1. POST /api/auth/login

**Descrição:** Realiza o login do usuário

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  },
  "token": "string",
  "refreshToken": "string"
}
```

**Resposta de Erro (400/401):**
```json
{
  "error": "string"
}
```

**Cookies Configurados:**
- `auth-token`: Token de acesso (1 hora)
- `refresh-token`: Token de renovação (7 dias)

---

### 2. POST /api/auth/logout

**Descrição:** Realiza o logout do usuário

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

**Cookies Limpos:**
- `auth-token`: Removido
- `refresh-token`: Removido

---

### 3. GET /api/auth/me

**Descrição:** Verifica o usuário autenticado atual

**Headers:**
```
Authorization: Bearer <token>
```
ou
```
Cookie: auth-token=<token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Resposta de Erro (401):**
```json
{
  "error": "Token não fornecido"
}
```

---

### 4. POST /api/auth/refresh

**Descrição:** Renova o token de acesso usando o refresh token

**Body (opcional):**
```json
{
  "refreshToken": "string"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Token renovado com sucesso",
  "token": "string",
  "refreshToken": "string"
}
```

**Resposta de Erro (400/401):**
```json
{
  "error": "string"
}
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Environment
NODE_ENV=development
```

### Credenciais de Teste

- **Usuário:** nuvelon
- **Senha:** 1234

## Segurança

- Tokens JWT com expiração de 1 hora
- Refresh tokens com expiração de 7 dias
- Cookies httpOnly e secure em produção
- Senhas hasheadas com bcrypt
- Validação de entrada em todas as rotas

## Middleware de Autenticação

Use o middleware `withAuth` para proteger rotas:

```typescript
import { withAuth } from '@/lib/auth-middleware'

export const GET = withAuth(async (request: NextRequest) => {
  // Sua lógica aqui
  // request.user contém os dados do usuário autenticado
})
``` 