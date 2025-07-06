import { NextRequest } from 'next/server'

export interface SecurityEvent {
  timestamp: Date
  event: string
  userId?: string
  username?: string
  ip: string
  userAgent?: string
  details?: Record<string, any>
  success: boolean
  error?: string
}

class SecurityLogger {
  private events: SecurityEvent[] = []
  private maxEvents = 1000 // Manter apenas os últimos 1000 eventos

  log(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    }

    this.events.push(securityEvent)

    // Limitar o número de eventos em memória
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Em produção, enviar para serviço de logging (ex: Sentry, LogRocket, etc.)
    console.log('[SECURITY]', JSON.stringify(securityEvent, null, 2))
  }

  // Log de tentativa de login
  logLoginAttempt(request: NextRequest, username: string, success: boolean, error?: string) {
    this.log({
      event: 'LOGIN_ATTEMPT',
      username,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success,
      error
    })
  }

  // Log de logout
  logLogout(request: NextRequest, userId?: string, username?: string) {
    this.log({
      event: 'LOGOUT',
      userId,
      username,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success: true
    })
  }

  // Log de acesso negado
  logAccessDenied(request: NextRequest, reason: string, userId?: string) {
    this.log({
      event: 'ACCESS_DENIED',
      userId,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: { reason },
      success: false,
      error: reason
    })
  }

  // Log de alteração de dados sensíveis
  logSensitiveDataChange(request: NextRequest, userId: string, action: string, details: Record<string, any>) {
    this.log({
      event: 'SENSITIVE_DATA_CHANGE',
      userId,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: { action, ...details },
      success: true
    })
  }

  // Log de rate limit excedido
  logRateLimitExceeded(request: NextRequest, limit: number, windowMs: number) {
    this.log({
      event: 'RATE_LIMIT_EXCEEDED',
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: { limit, windowMs },
      success: false,
      error: 'Rate limit exceeded'
    })
  }

  // Log de erro de validação
  logValidationError(request: NextRequest, errors: any[], userId?: string) {
    this.log({
      event: 'VALIDATION_ERROR',
      userId,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: { errors },
      success: false,
      error: 'Validation failed'
    })
  }

  // Obter eventos recentes
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit)
  }

  // Obter eventos por tipo
  getEventsByType(eventType: string): SecurityEvent[] {
    return this.events.filter(event => event.event === eventType)
  }

  // Obter eventos por usuário
  getEventsByUser(userId: string): SecurityEvent[] {
    return this.events.filter(event => event.userId === userId)
  }

  // Obter eventos por IP
  getEventsByIP(ip: string): SecurityEvent[] {
    return this.events.filter(event => event.ip === ip)
  }

  // Limpar eventos antigos (mais de 24 horas)
  cleanupOldEvents() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.events = this.events.filter(event => event.timestamp > oneDayAgo)
  }

  // Função para obter IP do cliente
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    return '127.0.0.1'
  }
}

// Instância singleton
export const securityLogger = new SecurityLogger()

// Limpar eventos antigos a cada hora
setInterval(() => {
  securityLogger.cleanupOldEvents()
}, 60 * 60 * 1000) 