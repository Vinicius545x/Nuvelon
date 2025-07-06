import { registerScheduledJobs } from './scheduled-jobs'
import { securityLogger } from '../security-logger'

export function initializeAutomation(): void {
  try {
    console.log('[AUTOMATION] Initializing automation system...')
    
    // Registrar jobs agendados
    registerScheduledJobs()
    
    // Log de inicialização
    securityLogger.log({
      event: 'AUTOMATION_INITIALIZED',
      ip: 'system',
      details: {
        timestamp: new Date().toISOString(),
        jobsRegistered: 6
      },
      success: true
    })
    
    console.log('[AUTOMATION] Automation system initialized successfully')
    
  } catch (error) {
    console.error('[AUTOMATION] Error initializing automation system:', error)
    
    securityLogger.log({
      event: 'AUTOMATION_INITIALIZATION_FAILED',
      ip: 'system',
      details: {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
    
    throw error
  }
}

// Inicializar automaticamente quando o módulo for carregado
if (typeof window === 'undefined') {
  // Apenas no servidor
  initializeAutomation()
} 