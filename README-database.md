# 🗄️ Configuração do Banco de Dados - Nuvelon

## 📋 Pré-requisitos

### MongoDB Local
1. **Instalar MongoDB Community Edition**
   - [Download MongoDB](https://www.mongodb.com/try/download/community)
   - Ou usar Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

### MongoDB Atlas (Recomendado para Produção)
1. **Criar conta no MongoDB Atlas**
   - [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Criar cluster gratuito**
3. **Configurar IP Whitelist**
4. **Criar usuário de banco**
5. **Obter string de conexão**

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp env.example .env.local
```

Edite o `.env.local`:
```env
# JWT Secrets
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Environment
NODE_ENV=development

# MongoDB (escolha uma opção)
MONGODB_URI=mongodb://localhost:27017/nuvelon
# ou para Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nuvelon
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Popular Banco com Dados Iniciais

```bash
npm run seed
```

**Dados criados:**
- ✅ Usuário admin: `nuvelon` / `1234`
- ✅ 6 planos (Mensal, Trimestral, Anual - Básico e Premium)
- ✅ 5 clientes de exemplo

## 🏗️ Estrutura do Banco

### Coleções Principais

| Coleção | Descrição | Documentos |
|---------|-----------|------------|
| `users` | Usuários do sistema | ~10 |
| `plans` | Planos de assinatura | ~10 |
| `clients` | Clientes da plataforma | ~1000+ |
| `clienthistories` | Histórico de alterações | ~5000+ |

### Índices Criados

```javascript
// users
{ username: 1 }        // único
{ email: 1 }          // único, sparse
{ role: 1 }
{ isActive: 1 }

// plans
{ name: 1 }
{ isActive: 1 }
{ durationMonths: 1 }
{ price: 1 }

// clients
{ name: 1 }
{ email: 1 }
{ status: 1 }
{ plan: 1 }
{ purchaseDate: 1 }
{ renewalDate: 1 }
{ "address.city": 1 }
{ "address.state": 1 }
{ $text: { $search: "name email notes" } }

// clienthistories
{ client: 1 }
{ user: 1 }
{ action: 1 }
{ createdAt: -1 }
{ client: 1, createdAt: -1 }
```

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Popular banco com dados de teste
npm run seed

# Limpar e repopular banco
npm run seed
```

### Produção

```bash
# Build da aplicação
npm run build

# Iniciar servidor de produção
npm start
```

## 📊 Monitoramento

### MongoDB Compass
- **Download:** [MongoDB Compass](https://www.mongodb.com/try/download/compass)
- **Conectar:** `mongodb://localhost:27017/nuvelon`
- **Visualizar:** Coleções, documentos, índices

### MongoDB Atlas
- **Dashboard:** Métricas de performance
- **Logs:** Consultas lentas
- **Alertas:** Configuráveis

## 🚀 Performance

### Otimizações Implementadas

1. **Conexão Reutilizada**
   - Cache de conexão entre requests
   - Evita overhead de reconexão

2. **Índices Estratégicos**
   - Campos de busca frequente
   - Índices compostos para consultas complexas

3. **Populate Seletivo**
   - Só campos necessários
   - Reduz transferência de dados

4. **Validação no Schema**
   - Validação no nível do banco
   - Reduz erros de aplicação

### Recomendações

```javascript
// ✅ Bom: Populate seletivo
const client = await Client.findById(id)
  .populate('plan', 'name price durationMonths')

// ❌ Evitar: Populate completo
const client = await Client.findById(id).populate('plan')

// ✅ Bom: Paginação
const clients = await Client.find({ status: 'Ativo' })
  .limit(20)
  .skip(0)
  .sort({ createdAt: -1 })

// ✅ Bom: Índices para consultas frequentes
clientSchema.index({ status: 1, renewalDate: 1 })
```

## 🔒 Segurança

### Implementado

- ✅ Hash de senhas com bcrypt
- ✅ Validação de entrada
- ✅ Sanitização de dados
- ✅ Índices seguros

### Recomendações

```javascript
// ✅ Bom: Validação no schema
{
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  }
}

// ✅ Bom: Exclusão de dados sensíveis
{
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password
      return ret
    }
  }
}
```

## 📈 Escalabilidade

### Preparado para Crescimento

1. **Índices Otimizados**
   - Consultas rápidas mesmo com milhões de documentos

2. **Estrutura Flexível**
   - Schemas extensíveis
   - Novos campos sem migração

3. **Auditoria Completa**
   - Histórico de todas as alterações
   - Rastreabilidade total

4. **Separação de Responsabilidades**
   - Modelos independentes
   - Fácil manutenção

## 🆘 Troubleshooting

### Problemas Comuns

**Erro de Conexão:**
```bash
# Verificar se MongoDB está rodando
mongosh mongodb://localhost:27017/nuvelon

# Verificar variável de ambiente
echo $MONGODB_URI
```

**Erro de Autenticação:**
```bash
# Recriar usuário admin
npm run seed
```

**Performance Lenta:**
```bash
# Verificar índices
db.clients.getIndexes()

# Analisar consultas
db.clients.find().explain("executionStats")
```

## 📚 Recursos Adicionais

- [Documentação MongoDB](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass) 