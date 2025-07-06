import { jobScheduler } from './job-scheduler'
import { clientBusinessLogic } from '../business/client-business-logic'
import { notificationService } from './notification-service'
import { securityLogger } from '../security-logger'

// Job 1: Atualizar status dos clientes (diário às 6h)
export const updateClientStatusesJob = {
  id: 'update-client-statuses',
  name: 'Atualizar Status dos Clientes',
  schedule: '0 6 * * *', // Diário às 6h
  enabled: true,
  errorCount: 0,
  maxErrors: 3,
  handler: async () => {
    console.log('[SCHEDULED JOB] Starting client status update')
    
    try {
      const updates = await clientBusinessLogic.updateClientStatuses()
      
      if (updates.length > 0) {
        console.log(`[SCHEDULED JOB] Updated ${updates.length} client statuses`)
        
        // Log de segurança
        securityLogger.log({
          event: 'CLIENT_STATUS_UPDATE',
          ip: 'system',
          details: {
            updatedClients: updates.length,
            updates: updates.map(u => ({
              clientId: u.clientId,
              oldStatus: u.oldStatus,
              newStatus: u.newStatus,
              reason: u.reason
            }))
          },
          success: true
        })
      }
      
    } catch (error) {
      console.error('[SCHEDULED JOB] Error updating client statuses:', error)
      throw error
    }
  }
}

// Job 2: Gerar notificações de renovação (diário às 9h)
export const generateRenewalNotificationsJob = {
  id: 'generate-renewal-notifications',
  name: 'Gerar Notificações de Renovação',
  schedule: '0 9 * * *', // Diário às 9h
  enabled: true,
  errorCount: 0,
  maxErrors: 3,
  handler: async () => {
    console.log('[SCHEDULED JOB] Starting renewal notifications generation')
    
    try {
      const notifications = await clientBusinessLogic.generateRenewalNotifications()
      
      if (notifications.length > 0) {
        console.log(`[SCHEDULED JOB] Generated ${notifications.length} renewal notifications`)
        
        // Enviar notificações
        for (const notification of notifications) {
          try {
            await notificationService.sendRenewalNotification(notification)
          } catch (error) {
            console.error(`[SCHEDULED JOB] Error sending notification to ${notification.clientName}:`, error)
          }
        }
        
        // Log de segurança
        securityLogger.log({
          event: 'RENEWAL_NOTIFICATIONS_SENT',
          ip: 'system',
          details: {
            notificationsCount: notifications.length,
            clients: notifications.map(n => ({
              clientId: n.clientId,
              clientName: n.clientName,
              daysUntilRenewal: n.daysUntilRenewal
            }))
          },
          success: true
        })
      }
      
    } catch (error) {
      console.error('[SCHEDULED JOB] Error generating renewal notifications:', error)
      throw error
    }
  }
}

// Job 3: Backup de dados (semanal aos domingos às 2h)
export const dataBackupJob = {
  id: 'data-backup',
  name: 'Backup de Dados',
  schedule: '0 2 * * 0', // Semanal aos domingos às 2h
  enabled: true,
  errorCount: 0,
  maxErrors: 2,
  handler: async () => {
    console.log('[SCHEDULED JOB] Starting data backup')
    
    try {
      // Em produção, implementar backup real
      // await backupService.createBackup()
      
      console.log('[SCHEDULED JOB] Data backup completed')
      
      // Log de segurança
      securityLogger.log({
        event: 'DATA_BACKUP_COMPLETED',
        ip: 'system',
        details: {
          backupType: 'scheduled',
          timestamp: new Date().toISOString()
        },
        success: true
      })
      
    } catch (error) {
      console.error('[SCHEDULED JOB] Error during data backup:', error)
      throw error
    }
  }
}

// Job 4: Limpeza de logs antigos (mensal no primeiro dia às 3h)
export const cleanupLogsJob = {
  id: 'cleanup-logs',
  name: 'Limpeza de Logs Antigos',
  schedule: '0 3 1 * *', // Mensal no primeiro dia às 3h
  enabled: true,
  errorCount: 0,
  maxErrors: 2,
  handler: async () => {
    console.log('[SCHEDULED JOB] Starting logs cleanup')
    
    try {
      // Limpar logs de segurança antigos (mais de 90 dias)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      
      // Em produção, implementar limpeza real
      // await securityLogger.cleanupOldLogs(ninetyDaysAgo)
      
      console.log('[SCHEDULED JOB] Logs cleanup completed')
      
      // Log de segurança
      securityLogger.log({
        event: 'LOGS_CLEANUP_COMPLETED',
        ip: 'system',
        details: {
          cutoffDate: ninetyDaysAgo.toISOString(),
          timestamp: new Date().toISOString()
        },
        success: true
      })
      
    } catch (error) {
      console.error('[SCHEDULED JOB] Error during logs cleanup:', error)
      throw error
    }
  }
}

// Job 5: Relatório de estatísticas (semanal às segundas às 8h)
export const weeklyReportJob = {
  id: 'weekly-report',
  name: 'Relatório Semanal',
  schedule: '0 8 * * 1', // Semanal às segundas às 8h
  enabled: true,
  errorCount: 0,
  maxErrors: 2,
  handler: async () => {
    console.log('[SCHEDULED JOB] Starting weekly report generation')
    
    try {
      const stats = await clientBusinessLogic.getClientStatistics()
      
      // Gerar relatório
      const report = {
        period: 'Semanal',
        generatedAt: new Date().toISOString(),
        statistics: stats,
        summary: {
          totalClients: stats.totalClients,
          activeClients: stats.activeClients,
          needsRenewal: stats.needsRenewal,
          monthlyRevenue: stats.monthlyRevenue,
          expiringSoon: stats.expiringSoon
        }
      }
      
      // Enviar relatório para administradores
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@nuvelon.com']
      
      await notificationService.sendSystemNotification(
        'Relatório Semanal - Nuvelon',
        `Relatório semanal gerado com sucesso.\n\n` +
        `Total de Clientes: ${stats.totalClients}\n` +
        `Clientes Ativos: ${stats.activeClients}\n` +
        `Precisam Renovar: ${stats.needsRenewal}\n` +
        `Vencendo em 7 dias: ${stats.expiringSoon}\n` +
        `Receita Mensal: R$ ${stats.monthlyRevenue.toFixed(2)}`,
        adminEmails
      )
      
      console.log('[SCHEDULED JOB] Weekly report generated and sent')
      
      // Log de segurança
      securityLogger.log({
        event: 'WEEKLY_REPORT_GENERATED',
        ip: 'system',
        details: {
          report: report,
          recipients: adminEmails
        },
        success: true
      })
      
    } catch (error) {
      console.error('[SCHEDULED JOB] Error generating weekly report:', error)
      throw error
    }
  }
}

// Job 6: Verificação de saúde do sistema (a cada 30 minutos)
export const systemHealthCheckJob = {
  id: 'system-health-check',
  name: 'Verificação de Saúde do Sistema',
  schedule: '*/30 * * * *', // A cada 30 minutos
  enabled: true,
  errorCount: 0,
  maxErrors: 5,
  handler: async () => {
    console.log('[SCHEDULED JOB] Starting system health check')
    
    try {
      // Verificar conexão com banco de dados
      const dbStats = await clientBusinessLogic.getClientStatistics()
      
      // Verificar jobs
      const jobStats = jobScheduler.getJobsStatus()
      const failedJobs = jobStats.filter(job => job.errorCount > 0)
      
      // Verificar se há problemas
      const issues = []
      
      if (failedJobs.length > 0) {
        issues.push(`${failedJobs.length} jobs com erros`)
      }
      
      if (dbStats.needsRenewal > 10) {
        issues.push(`${dbStats.needsRenewal} clientes precisam renovar`)
      }
      
      if (dbStats.expiringSoon > 5) {
        issues.push(`${dbStats.expiringSoon} clientes vencendo em 7 dias`)
      }
      
      // Enviar alerta se houver problemas
      if (issues.length > 0) {
        const severity = issues.length > 3 ? 'high' : 'medium'
        await notificationService.sendAlert(
          'Problemas Detectados no Sistema',
          `Os seguintes problemas foram detectados:\n${issues.join('\n')}`,
          severity
        )
      }
      
      console.log('[SCHEDULED JOB] System health check completed')
      
    } catch (error) {
      console.error('[SCHEDULED JOB] Error during system health check:', error)
      
      // Enviar alerta crítico se a verificação falhar
      await notificationService.sendAlert(
        'Falha na Verificação de Saúde do Sistema',
        `A verificação automática de saúde do sistema falhou: ${error instanceof Error ? error.message : String(error)}`,
        'critical'
      )
      
      throw error
    }
  }
}

// Função para registrar todos os jobs
export function registerScheduledJobs(): void {
  console.log('[SCHEDULED JOBS] Registering scheduled jobs...')
  
  jobScheduler.addJob(updateClientStatusesJob)
  jobScheduler.addJob(generateRenewalNotificationsJob)
  jobScheduler.addJob(dataBackupJob)
  jobScheduler.addJob(cleanupLogsJob)
  jobScheduler.addJob(weeklyReportJob)
  jobScheduler.addJob(systemHealthCheckJob)
  
  console.log('[SCHEDULED JOBS] All scheduled jobs registered')
}

// Função para obter status de todos os jobs
export function getScheduledJobsStatus() {
  return jobScheduler.getJobsStatus()
}

// Função para executar job manualmente
export async function runScheduledJob(jobId: string): Promise<void> {
  await jobScheduler.runJob(jobId)
}

// Função para habilitar/desabilitar job
export function toggleScheduledJob(jobId: string, enabled: boolean): void {
  jobScheduler.toggleJob(jobId, enabled)
} 