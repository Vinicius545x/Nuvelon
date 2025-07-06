# Estrutura do Banco de Dados - MongoDB

## Visão Geral

O sistema Nuvelon utiliza MongoDB com Mongoose como ODM (Object Document Mapper). A estrutura foi projetada para ser escalável, performática e manter a integridade dos dados.

## Coleções (Collections)

### 1. **users**

**Descrição:** Armazena informações dos usuários do sistema (administradores)

**Schema:**
```typescript
{
  username: string,        // Único, obrigatório, 3-50 chars
  email?: string,         // Único, opcional, formato válido
  password: string,       // Hash bcrypt, obrigatório, min 6 chars
  role: 'admin' | 'user', // Enum, default: 'user'
  isActive: boolean,      // Default: true
  lastLogin?: Date,       // Atualizado automaticamente
  createdAt: Date,        // Timestamp automático
  updatedAt: Date         // Timestamp automático
}
```

**Índices:**
- `username: 1` (único)
- `email: 1` (único, sparse)
- `role: 1`
- `isActive: 1`

**Funcionalidades:**
- Hash automático de senha com bcrypt
- Método `comparePassword()` para verificação
- Exclusão de senha no JSON de resposta

---

### 2. **plans**

**Descrição:** Armazena os planos de assinatura disponíveis

**Schema:**
```typescript
{
  name: string,           // Obrigatório, max 100 chars
  description?: string,   // Opcional, max 500 chars
  durationMonths: number, // Obrigatório, 1-60 meses
  price: number,         // Obrigatório, >= 0
  features: string[],    // Array de recursos
  isActive: boolean,     // Default: true
  maxClients?: number,   // Opcional, >= 1
  createdAt: Date,       // Timestamp automático
  updatedAt: Date        // Timestamp automático
}
```

**Índices:**
- `name: 1`
- `isActive: 1`
- `durationMonths: 1`
- `price: 1`

**Virtuals:**
- `pricePerMonth`: Calcula preço por mês

---

### 3. **clients**

**Descrição:** Armazena informações dos clientes da plataforma

**Schema:**
```typescript
{
  name: string,                    // Obrigatório, max 255 chars
  email?: string,                 // Opcional, formato válido
  phone?: string,                 // Opcional, formato válido
  plan: ObjectId,                 // Referência ao plano
  purchaseDate: Date,             // Obrigatório, default: now
  renewalDate: Date,              // Calculado automaticamente
  status: 'Ativo' | 'Precisa Renovar' | 'Cancelado' | 'Suspenso',
  notes?: string,                 // Opcional, max 1000 chars
  address: {
    street?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string
  },
  paymentInfo: {
    method?: string,
    lastPayment?: Date,
    nextPayment?: Date
  },
  createdAt: Date,                // Timestamp automático
  updatedAt: Date                 // Timestamp automático
}
```

**Índices:**
- `name: 1`
- `email: 1`
- `status: 1`
- `plan: 1`
- `purchaseDate: 1`
- `renewalDate: 1`
- `address.city: 1`
- `address.state: 1`
- Text search: `name`, `email`, `notes`

**Funcionalidades:**
- Cálculo automático de `renewalDate` baseado no plano
- Método `updateStatus()` para atualizar status
- Virtual `daysUntilRenewal` para calcular dias até renovação

---

### 4. **clienthistories**

**Descrição:** Audit trail de todas as alterações em clientes

**Schema:**
```typescript
{
  client: ObjectId,               // Referência ao cliente
  action: string,                 // Tipo de ação
  oldValues?: Object,             // Valores anteriores
  newValues?: Object,             // Novos valores
  user: ObjectId,                 // Usuário que fez a alteração
  ipAddress?: string,             // IP do usuário
  userAgent?: string,             // User agent
  createdAt: Date                 // Timestamp automático
}
```

**Ações Registradas:**
- `created`: Cliente criado
- `updated`: Cliente atualizado
- `deleted`: Cliente deletado
- `status_changed`: Status alterado
- `plan_changed`: Plano alterado
- `renewal_date_changed`: Data de renovação alterada
- `payment_received`: Pagamento recebido
- `payment_failed`: Falha no pagamento
- `suspended`: Cliente suspenso
- `reactivated`: Cliente reativado

**Índices:**
- `client: 1`
- `user: 1`
- `action: 1`
- `createdAt: -1`
- `client: 1, createdAt: -1`

---

## Relacionamentos

### Referências
- **clients.plan** → **plans._id**
- **clienthistories.client** → **clients._id**
- **clienthistories.user** → **users._id**

### Populate
```typescript
// Buscar cliente com dados do plano
const client = await Client.findById(id).populate('plan')

// Buscar histórico com dados do cliente e usuário
const history = await ClientHistory.findById(id)
  .populate('client')
  .populate('user', 'username email')
```

---

## Configuração

### Variáveis de Ambiente
```env
MONGODB_URI=mongodb://localhost:27017/nuvelon
# ou
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nuvelon
```

### Conexão
```typescript
import dbConnect from '@/lib/database'

// Em cada API route
await dbConnect()
```

---

## Dados Iniciais

### Script de Seed
```bash
npm run seed
```

**Cria automaticamente:**
- 1 usuário admin (nuvelon/1234)
- 6 planos (Mensal, Trimestral, Anual - Básico e Premium)
- 5 clientes de exemplo

---

## Performance

### Índices Otimizados
- Índices simples para campos únicos
- Índices compostos para consultas frequentes
- Índice de texto para busca
- Índices TTL opcionais para limpeza automática

### Boas Práticas
- Conexão reutilizada entre requests
- Populate seletivo (só campos necessários)
- Paginação em consultas grandes
- Índices em campos de busca frequente

---

## Backup e Manutenção

### Backup
```bash
# Backup completo
mongodump --db nuvelon --out ./backup

# Restore
mongorestore --db nuvelon ./backup/nuvelon
```

### Limpeza
- Histórico: TTL index opcional (90 dias)
- Logs: Manutenção manual ou automática
- Índices: Rebuild periódico se necessário 