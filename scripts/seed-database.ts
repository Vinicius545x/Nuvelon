import dbConnect from '../lib/database'
import User from '../models/User'
import Plan from '../models/Plan'
import Client from '../models/Client'

async function seedDatabase() {
  try {
    await dbConnect()
    console.log('Conectado ao MongoDB')

    // Limpar dados existentes
    await User.deleteMany({})
    await Plan.deleteMany({})
    await Client.deleteMany({})
    console.log('Dados existentes removidos')

    // Criar usuário admin
    const adminUser = await User.create({
      username: 'nuvelon',
      email: 'admin@nuvelon.com',
      password: '1234', // Será hasheada automaticamente
      role: 'admin',
      isActive: true
    })
    console.log('Usuário admin criado:', adminUser.username)

    // Criar planos
    const plans = await Plan.create([
      {
        name: 'Mensal Básico',
        description: 'Plano básico mensal com recursos essenciais',
        durationMonths: 1,
        price: 29.90,
        features: [
          'Acesso a jogos básicos',
          'Suporte por email',
          '1 dispositivo simultâneo'
        ],
        isActive: true
      },
      {
        name: 'Mensal Premium',
        description: 'Plano premium mensal com recursos avançados',
        durationMonths: 1,
        price: 49.90,
        features: [
          'Acesso a todos os jogos',
          'Suporte prioritário',
          '2 dispositivos simultâneos',
          'Qualidade 4K'
        ],
        isActive: true
      },
      {
        name: 'Trimestral Básico',
        description: 'Plano básico trimestral com desconto',
        durationMonths: 3,
        price: 79.90,
        features: [
          'Acesso a jogos básicos',
          'Suporte por email',
          '1 dispositivo simultâneo',
          '10% de desconto'
        ],
        isActive: true
      },
      {
        name: 'Trimestral Premium',
        description: 'Plano premium trimestral com desconto',
        durationMonths: 3,
        price: 129.90,
        features: [
          'Acesso a todos os jogos',
          'Suporte prioritário',
          '2 dispositivos simultâneos',
          'Qualidade 4K',
          '10% de desconto'
        ],
        isActive: true
      },
      {
        name: 'Anual Básico',
        description: 'Plano básico anual com maior desconto',
        durationMonths: 12,
        price: 299.90,
        features: [
          'Acesso a jogos básicos',
          'Suporte por email',
          '1 dispositivo simultâneo',
          '20% de desconto'
        ],
        isActive: true
      },
      {
        name: 'Anual Pro',
        description: 'Plano profissional anual com todos os recursos',
        durationMonths: 12,
        price: 499.90,
        features: [
          'Acesso a todos os jogos',
          'Suporte prioritário 24/7',
          '3 dispositivos simultâneos',
          'Qualidade 4K HDR',
          '20% de desconto',
          'Acesso antecipado a novos jogos'
        ],
        isActive: true
      }
    ])
    console.log(`${plans.length} planos criados`)

    // Criar clientes de exemplo
    const clients = await Client.create([
      {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+5511999999999',
        plan: plans[1]._id, // Mensal Premium
        purchaseDate: new Date('2024-11-01'),
        status: 'Ativo',
        notes: 'Cliente VIP, sempre paga em dia',
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          country: 'Brasil'
        },
        paymentInfo: {
          method: 'Cartão de Crédito',
          lastPayment: new Date('2024-11-01'),
          nextPayment: new Date('2024-12-01')
        }
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '+5511888888888',
        plan: plans[2]._id, // Trimestral Básico
        purchaseDate: new Date('2024-09-15'),
        status: 'Precisa Renovar',
        notes: 'Primeira compra, cliente novo',
        address: {
          street: 'Av. Paulista, 456',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brasil'
        }
      },
      {
        name: 'Pedro Costa',
        email: 'pedro.costa@email.com',
        phone: '+5511777777777',
        plan: plans[5]._id, // Anual Pro
        purchaseDate: new Date('2024-01-10'),
        status: 'Ativo',
        notes: 'Cliente fidelizado há 2 anos',
        address: {
          street: 'Rua Augusta, 789',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01205-000',
          country: 'Brasil'
        },
        paymentInfo: {
          method: 'PIX',
          lastPayment: new Date('2024-01-10'),
          nextPayment: new Date('2025-01-10')
        }
      },
      {
        name: 'Ana Oliveira',
        email: 'ana.oliveira@email.com',
        phone: '+5511666666666',
        plan: plans[0]._id, // Mensal Básico
        purchaseDate: new Date('2024-10-01'),
        status: 'Precisa Renovar',
        notes: 'Suporte técnico necessário',
        address: {
          street: 'Rua Oscar Freire, 321',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01426-000',
          country: 'Brasil'
        }
      },
      {
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@email.com',
        phone: '+5511555555555',
        plan: plans[3]._id, // Trimestral Premium
        purchaseDate: new Date('2024-08-01'),
        status: 'Ativo',
        notes: 'Cliente corporativo',
        address: {
          street: 'Av. Brigadeiro Faria Lima, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01452-002',
          country: 'Brasil'
        },
        paymentInfo: {
          method: 'Boleto Bancário',
          lastPayment: new Date('2024-08-01'),
          nextPayment: new Date('2024-11-01')
        }
      }
    ])
    console.log(`${clients.length} clientes criados`)

    console.log('✅ Banco de dados populado com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error)
    process.exit(1)
  }
}

seedDatabase() 