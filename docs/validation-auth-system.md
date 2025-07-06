# Sistema de Validação e Autenticação - Nuvelon

## Visão Geral

O sistema de validação e autenticação do Nuvelon foi projetado para fornecer segurança robusta, validação de dados confiável e auditoria completa de todas as operações sensíveis.

## Componentes Principais

### 1. Validação com Zod

#### Schemas de Validação
- **`lib/validations/auth.ts`**: Schemas para autenticação
  - `loginSchema`: Validação de login
  - `registerSchema`: Validação de registro
  - `changePasswordSchema`: Validação de alteração de senha
  - `refreshTokenSchema`: Validação de refresh token

- **`lib/validations/client.ts`**: Schemas para clientes
  - `createClientSchema`: Validação de criação de cliente
  - `updateClientSchema`: Validação de atualização de cliente
  - `searchClientSchema`: Validação de busca de clientes
  - `clientFiltersSchema`: Validação de filtros

#### Middleware de Validação
- **`lib/validation-middleware.ts`**: Middleware para validação automática
  - `withValidation()`: Valida dados do body da requisição
  - `withQueryValidation()`: Valida query parameters
  - `getValidatedData()`: Extrai dados validados

### 2. Autenticação JWT

#### Middleware de Autenticação
- **`lib/auth-middleware.ts`**: Sistema completo de autenticação
  - `withAuth()`: Verifica autenticação básica
  - `withRole()`: Verifica role específica
  - `withAnyRole()`: Verifica múltiplas roles
  - `getAuthenticatedUser()`: Obtém usuário autenticado

#### Rotas de Autenticação
- **`/api/auth/login`**: Login com validação e rate limiting
- **`/api/auth/logout`**: Logout com limpeza de cookies
- **`/api/auth/me`**: Informações do usuário autenticado
- **`/api/auth/refresh`**: Renovação de token

### 3. Rate Limiting

#### Sistema de Proteção
- **`lib/rate-limiter.ts`**: Proteção contra ataques de força bruta
  - `loginRateLimiter`: 5 tentativas por 15 minutos
  - `generalRateLimiter`: 100 requisições por minuto
  - Headers de rate limit incluídos nas respostas

### 4. Auditoria de Segurança

#### Sistema de Logs
- **`lib/security-logger.ts`**: Auditoria completa de segurança
  - Logs de tentativas de login (sucesso/falha)
  - Logs de logout
  - Logs de acesso negado
  - Logs de alterações de dados sensíveis
  - Logs de rate limit excedido
  - Logs de erros de validação

## Uso Prático

### 1. Protegendo uma Rota

```typescript
// Rota protegida com autenticação
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const user = getAuthenticatedUser(request)
  // ... lógica da rota
})

// Rota protegida com role específica
export const POST = withRole('admin')(async (request: AuthenticatedRequest) => {
  // ... lógica da rota
})
```

### 2. Validando Dados

```typescript
// Rota com validação
export const POST = withValidation(createClientSchema)(async (request: NextRequest) => {
  const data = getValidatedData(request)
  // ... lógica da rota
})

// Rota com validação e autenticação
export const PUT = withAuth(withValidation(updateClientSchema))(async (request: AuthenticatedRequest) => {
  const data = getValidatedData(request)
  const user = getAuthenticatedUser(request)
  // ... lógica da rota
})
```

### 3. Rate Limiting

```typescript
// Rota com rate limiting
export const POST = loginRateLimiter(withValidation(loginSchema)(loginHandler))
```

## Configuração de Segurança

### Variáveis de Ambiente

```env
# JWT Secrets (obrigatório em produção)
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Configurações de segurança
NODE_ENV=production
```

### Cookies Seguros

- `httpOnly: true`: Previne acesso via JavaScript
- `secure: true`: Apenas HTTPS em produção
- `sameSite: 'strict'`: Proteção contra CSRF
- `maxAge`: Tempo de expiração configurável

## Validações Implementadas

### Autenticação
- Username: 3-50 caracteres
- Password: 6-100 caracteres, com regex de complexidade
- Email: Formato válido, normalizado

### Clientes
- Nome: 2-255 caracteres
- Email: Formato válido (opcional)
- Telefone: Formato internacional (opcional)
- Plano: Obrigatório
- Data de compra: Data válida
- Status: Enum predefinido
- Observações: Máximo 1000 caracteres

### Endereço
- Rua: Máximo 255 caracteres
- Cidade: Máximo 100 caracteres
- Estado: Máximo 50 caracteres
- CEP: Máximo 20 caracteres
- País: Máximo 100 caracteres

## Monitoramento e Logs

### Eventos Monitorados
1. **Tentativas de Login**
   - Sucesso/Falha
   - IP do usuário
   - User Agent
   - Motivo da falha

2. **Acessos Negados**
   - Token inválido/expirado
   - Permissões insuficientes
   - Rate limit excedido

3. **Alterações Sensíveis**
   - Mudanças de senha
   - Alterações de perfil
   - Operações administrativas

### Consulta de Logs

```typescript
// Obter eventos recentes
const events = securityLogger.getRecentEvents(100)

// Filtrar por tipo
const loginEvents = securityLogger.getEventsByType('LOGIN_ATTEMPT')

// Filtrar por usuário
const userEvents = securityLogger.getEventsByUser(userId)

// Filtrar por IP
const ipEvents = securityLogger.getEventsByIP(ip)
```

## Boas Práticas

### 1. Segurança
- Sempre use HTTPS em produção
- Troque as chaves JWT em produção
- Monitore logs de segurança regularmente
- Implemente alertas para tentativas suspeitas

### 2. Validação
- Valide dados tanto no frontend quanto no backend
- Use schemas específicos para cada operação
- Forneça mensagens de erro claras
- Sanitize dados antes de salvar

### 3. Performance
- Use rate limiting apropriado
- Implemente cache para dados frequentemente acessados
- Monitore tempo de resposta das APIs
- Limpe logs antigos regularmente

## Troubleshooting

### Problemas Comuns

1. **Erro 401 - Token inválido**
   - Verificar se o token está sendo enviado corretamente
   - Verificar se o token não expirou
   - Verificar se a chave JWT está correta

2. **Erro 429 - Rate limit excedido**
   - Aguardar o tempo de reset
   - Verificar se não há múltiplas requisições simultâneas
   - Ajustar limites se necessário

3. **Erro 400 - Validação falhou**
   - Verificar dados enviados
   - Verificar schema de validação
   - Verificar mensagens de erro específicas

### Debug

```typescript
// Habilitar logs detalhados
console.log('Validation errors:', errors)
console.log('Rate limit stats:', getRateLimitStats(ip))
console.log('Security events:', securityLogger.getRecentEvents(10))
``` 