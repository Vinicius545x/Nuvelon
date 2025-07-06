import dbConnect from '../database'
import Client from '@/models/Client'
import Plan from '@/models/Plan'
import ClientHistory from '@/models/ClientHistory'
import { securityLogger } from '../security-logger'

export interface ClientStatusUpdate {
  clientId: string
  oldStatus: string
  newStatus: string
  reason: string
  updatedBy?: string
}

export interface RenewalNotification {
  clientId: string
  clientName: string
  email?: string
  phone?: string
  planName: string
  renewalDate: Date
  daysUntilRenewal: number
}

export class ClientBusinessLogic {
  // Atualizar status dos clientes baseado na data de renovação
  async updateClientStatuses(): Promise<ClientStatusUpdate[]> {
    await dbConnect()
    
    const updates: ClientStatusUpdate[] = []
    const now = new Date()
    
    try {
      // Buscar clientes ativos
      const activeClients = await Client.find({ status: 'Ativo' })
      
      for (const client of activeClients) {
        const oldStatus = client.status
        let newStatus = oldStatus
        let reason = ''
        
        // Verificar se precisa renovar (7 dias antes)
        const renewalDate = new Date(client.renewalDate)
        const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilRenewal <= 0) {
          // Cliente vencido
          newStatus = 'Precisa Renovar'
          reason = 'Plano vencido'
        } else if (daysUntilRenewal <= 7) {
          // Cliente próximo do vencimento
          newStatus = 'Precisa Renovar'
          reason = `Renovação em ${daysUntilRenewal} dias`
        }
        
        // Atualizar status se necessário
        if (newStatus !== oldStatus) {
          client.status = newStatus
          await client.save()
          
          // Registrar no histórico
          await ClientHistory.create({
            clientId: client._id,
            action: 'STATUS_CHANGE',
            details: {
              oldStatus,
              newStatus,
              reason,
              automated: true
            },
            timestamp: new Date()
          })
          
          updates.push({
            clientId: client._id.toString(),
            oldStatus,
            newStatus,
            reason,
            updatedBy: 'system'
          })
        }
      }
      
      console.log(`[BUSINESS LOGIC] Updated ${updates.length} client statuses`)
      return updates
      
    } catch (error) {
      console.error('[BUSINESS LOGIC] Error updating client statuses:', error)
      throw error
    }
  }

  // Gerar notificações de renovação
  async generateRenewalNotifications(): Promise<RenewalNotification[]> {
    await dbConnect()
    
    const notifications: RenewalNotification[] = []
    const now = new Date()
    
    try {
      // Buscar clientes que precisam renovar nos próximos 7 dias
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const clientsNeedingRenewal = await Client.find({
        status: { $in: ['Ativo', 'Precisa Renovar'] },
        renewalDate: { $lte: sevenDaysFromNow }
      }).populate('plan')
      
      for (const client of clientsNeedingRenewal) {
        const renewalDate = new Date(client.renewalDate)
        const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Gerar notificação se faltam 7, 3, 1 dias ou se está vencido
        if (daysUntilRenewal <= 7 && (daysUntilRenewal === 7 || daysUntilRenewal === 3 || daysUntilRenewal === 1 || daysUntilRenewal <= 0)) {
          notifications.push({
            clientId: client._id.toString(),
            clientName: client.name,
            email: client.email,
            phone: client.phone,
            planName: client.plan.name,
            renewalDate,
            daysUntilRenewal
          })
        }
      }
      
      console.log(`[BUSINESS LOGIC] Generated ${notifications.length} renewal notifications`)
      return notifications
      
    } catch (error) {
      console.error('[BUSINESS LOGIC] Error generating renewal notifications:', error)
      throw error
    }
  }

  // Renovar cliente
  async renewClient(clientId: string, planId: string, renewedBy: string): Promise<Client> {
    await dbConnect()
    
    try {
      const client = await Client.findById(clientId)
      if (!client) {
        throw new Error('Cliente não encontrado')
      }
      
      const plan = await Plan.findById(planId)
      if (!plan) {
        throw new Error('Plano não encontrado')
      }
      
      const oldStatus = client.status
      const oldPlan = client.plan
      const oldRenewalDate = client.renewalDate
      
      // Calcular nova data de renovação
      const newRenewalDate = new Date()
      switch (plan.duration) {
        case 'Mensal':
          newRenewalDate.setMonth(newRenewalDate.getMonth() + 1)
          break
        case 'Trimestral':
          newRenewalDate.setMonth(newRenewalDate.getMonth() + 3)
          break
        case 'Anual':
          newRenewalDate.setFullYear(newRenewalDate.getFullYear() + 1)
          break
        default:
          throw new Error('Duração do plano inválida')
      }
      
      // Atualizar cliente
      client.plan = planId
      client.status = 'Ativo'
      client.renewalDate = newRenewalDate
      client.purchaseDate = new Date()
      
      // Atualizar informações de pagamento
      if (!client.paymentInfo) {
        client.paymentInfo = {}
      }
      client.paymentInfo.lastPayment = new Date()
      client.paymentInfo.nextPayment = newRenewalDate
      
      await client.save()
      
      // Registrar no histórico
      await ClientHistory.create({
        clientId: client._id,
        action: 'RENEWAL',
        details: {
          oldPlan: oldPlan.toString(),
          newPlan: planId,
          oldStatus,
          newStatus: 'Ativo',
          oldRenewalDate,
          newRenewalDate,
          renewedBy
        },
        timestamp: new Date()
      })
      
      // Log de segurança
      securityLogger.log({
        event: 'CLIENT_RENEWED',
        userId: renewedBy,
        ip: 'system',
        details: {
          clientId: client._id.toString(),
          clientName: client.name,
          oldPlan: oldPlan.toString(),
          newPlan: planId,
          oldRenewalDate,
          newRenewalDate
        },
        success: true
      })
      
      console.log(`[BUSINESS LOGIC] Client ${client.name} renewed successfully`)
      return client
      
    } catch (error) {
      console.error('[BUSINESS LOGIC] Error renewing client:', error)
      throw error
    }
  }

  // Cancelar cliente
  async cancelClient(clientId: string, reason: string, cancelledBy: string): Promise<Client> {
    await dbConnect()
    
    try {
      const client = await Client.findById(clientId)
      if (!client) {
        throw new Error('Cliente não encontrado')
      }
      
      const oldStatus = client.status
      
      // Atualizar cliente
      client.status = 'Cancelado'
      await client.save()
      
      // Registrar no histórico
      await ClientHistory.create({
        clientId: client._id,
        action: 'CANCELLATION',
        details: {
          oldStatus,
          newStatus: 'Cancelado',
          reason,
          cancelledBy
        },
        timestamp: new Date()
      })
      
      // Log de segurança
      securityLogger.log({
        event: 'CLIENT_CANCELLED',
        userId: cancelledBy,
        ip: 'system',
        details: {
          clientId: client._id.toString(),
          clientName: client.name,
          reason
        },
        success: true
      })
      
      console.log(`[BUSINESS LOGIC] Client ${client.name} cancelled`)
      return client
      
    } catch (error) {
      console.error('[BUSINESS LOGIC] Error cancelling client:', error)
      throw error
    }
  }

  // Suspender cliente
  async suspendClient(clientId: string, reason: string, suspendedBy: string): Promise<Client> {
    await dbConnect()
    
    try {
      const client = await Client.findById(clientId)
      if (!client) {
        throw new Error('Cliente não encontrado')
      }
      
      const oldStatus = client.status
      
      // Atualizar cliente
      client.status = 'Suspenso'
      await client.save()
      
      // Registrar no histórico
      await ClientHistory.create({
        clientId: client._id,
        action: 'SUSPENSION',
        details: {
          oldStatus,
          newStatus: 'Suspenso',
          reason,
          suspendedBy
        },
        timestamp: new Date()
      })
      
      // Log de segurança
      securityLogger.log({
        event: 'CLIENT_SUSPENDED',
        userId: suspendedBy,
        ip: 'system',
        details: {
          clientId: client._id.toString(),
          clientName: client.name,
          reason
        },
        success: true
      })
      
      console.log(`[BUSINESS LOGIC] Client ${client.name} suspended`)
      return client
      
    } catch (error) {
      console.error('[BUSINESS LOGIC] Error suspending client:', error)
      throw error
    }
  }

  // Reativar cliente
  async reactivateClient(clientId: string, reactivatedBy: string): Promise<Client> {
    await dbConnect()
    
    try {
      const client = await Client.findById(clientId)
      if (!client) {
        throw new Error('Cliente não encontrado')
      }
      
      const oldStatus = client.status
      
      // Atualizar cliente
      client.status = 'Ativo'
      await client.save()
      
      // Registrar no histórico
      await ClientHistory.create({
        clientId: client._id,
        action: 'REACTIVATION',
        details: {
          oldStatus,
          newStatus: 'Ativo',
          reactivatedBy
        },
        timestamp: new Date()
      })
      
      // Log de segurança
      securityLogger.log({
        event: 'CLIENT_REACTIVATED',
        userId: reactivatedBy,
        ip: 'system',
        details: {
          clientId: client._id.toString(),
          clientName: client.name
        },
        success: true
      })
      
      console.log(`[BUSINESS LOGIC] Client ${client.name} reactivated`)
      return client
      
    } catch (error) {
      console.error('[BUSINESS LOGIC] Error reactivating client:', error)
      throw error
    }
  }

  // Obter estatísticas de clientes
  async getClientStatistics() {
    await dbConnect()
    
    try {
      const totalClients = await Client.countDocuments()
      const activeClients = await Client.countDocuments({ status: 'Ativo' })
      const needsRenewal = await Client.countDocuments({ status: 'Precisa Renovar' })
      const cancelledClients = await Client.countDocuments({ status: 'Cancelado' })
      const suspendedClients = await Client.countDocuments({ status: 'Suspenso' })
      
      // Clientes vencendo nos próximos 7 dias
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const expiringSoon = await Client.countDocuments({
        status: { $in: ['Ativo', 'Precisa Renovar'] },
        renewalDate: { $lte: sevenDaysFromNow }
      })
      
      // Receita mensal estimada
      const activeClientsWithPlans = await Client.find({ status: 'Ativo' }).populate('plan')
      const monthlyRevenue = activeClientsWithPlans.reduce((total, client) => {
        return total + (client.plan?.price || 0)
      }, 0)
      
      return {
        totalClients,
        activeClients,
        needsRenewal,
        cancelledClients,
        suspendedClients,
        expiringSoon,
        monthlyRevenue
      }
      
    } catch (error) {
      console.error('[BUSINESS LOGIC] Error getting client statistics:', error)
      throw error
    }
  }
}

// Instância singleton
export const clientBusinessLogic = new ClientBusinessLogic() 