import { RenewalNotification } from '../business/client-business-logic'
import { securityLogger } from '../security-logger'

export interface Notification {
  id: string
  type: 'renewal' | 'system' | 'alert'
  title: string
  message: string
  recipient: string
  recipientType: 'email' | 'phone' | 'admin'
  status: 'pending' | 'sent' | 'failed'
  createdAt: Date
  sentAt?: Date
  metadata?: Record<string, any>
}

export interface EmailNotification {
  to: string
  subject: string
  body: string
  html?: string
}

export interface SMSNotification {
  to: string
  message: string
}

class NotificationService {
  private notifications: Notification[] = []
  private maxNotifications = 1000

  // Enviar notificação de renovação
  async sendRenewalNotification(notification: RenewalNotification): Promise<void> {
    try {
      const { clientName, email, phone, planName, renewalDate, daysUntilRenewal } = notification
      
      // Determinar tipo de mensagem baseado nos dias restantes
      let urgency = ''
      let actionRequired = ''
      
      if (daysUntilRenewal <= 0) {
        urgency = 'URGENTE'
        actionRequired = 'Seu plano expirou! Renove imediatamente para continuar usando nossos serviços.'
      } else if (daysUntilRenewal === 1) {
        urgency = 'IMPORTANTE'
        actionRequired = 'Seu plano expira amanhã! Renove hoje para evitar interrupção do serviço.'
      } else if (daysUntilRenewal <= 3) {
        urgency = 'ATENÇÃO'
        actionRequired = `Seu plano expira em ${daysUntilRenewal} dias. Renove agora para continuar sem interrupções.`
      } else {
        urgency = 'LEMBRETE'
        actionRequired = `Seu plano expira em ${daysUntilRenewal} dias. Considere renovar antecipadamente.`
      }

      // Enviar email se disponível
      if (email) {
        await this.sendEmailNotification({
          to: email,
          subject: `[${urgency}] Renovação do Plano ${planName} - Nuvelon`,
          body: this.generateRenewalEmailBody(clientName, planName, renewalDate, daysUntilRenewal, actionRequired),
          html: this.generateRenewalEmailHTML(clientName, planName, renewalDate, daysUntilRenewal, actionRequired)
        })
      }

      // Enviar SMS se disponível
      if (phone) {
        await this.sendSMSNotification({
          to: phone,
          message: this.generateRenewalSMSMessage(clientName, planName, daysUntilRenewal, actionRequired)
        })
      }

      // Registrar notificação
      this.addNotification({
        id: `renewal_${notification.clientId}_${Date.now()}`,
        type: 'renewal',
        title: `Renovação do Plano ${planName}`,
        message: actionRequired,
        recipient: email || phone || 'admin',
        recipientType: email ? 'email' : phone ? 'phone' : 'admin',
        status: 'sent',
        createdAt: new Date(),
        sentAt: new Date(),
        metadata: {
          clientId: notification.clientId,
          clientName,
          planName,
          renewalDate,
          daysUntilRenewal
        }
      })

      console.log(`[NOTIFICATION] Renewal notification sent to ${clientName}`)
      
    } catch (error) {
      console.error('[NOTIFICATION] Error sending renewal notification:', error)
      
      // Log de erro
      securityLogger.log({
        event: 'NOTIFICATION_FAILED',
        ip: 'system',
        details: {
          type: 'renewal',
          clientId: notification.clientId,
          clientName: notification.clientName,
          error: error instanceof Error ? error.message : String(error)
        },
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      
      throw error
    }
  }

  // Enviar notificação de sistema
  async sendSystemNotification(title: string, message: string, recipients: string[]): Promise<void> {
    try {
      for (const recipient of recipients) {
        await this.sendEmailNotification({
          to: recipient,
          subject: `[SISTEMA] ${title} - Nuvelon`,
          body: message,
          html: this.generateSystemEmailHTML(title, message)
        })

        this.addNotification({
          id: `system_${Date.now()}_${Math.random()}`,
          type: 'system',
          title,
          message,
          recipient,
          recipientType: 'email',
          status: 'sent',
          createdAt: new Date(),
          sentAt: new Date()
        })
      }

      console.log(`[NOTIFICATION] System notification sent to ${recipients.length} recipients`)
      
    } catch (error) {
      console.error('[NOTIFICATION] Error sending system notification:', error)
      throw error
    }
  }

  // Enviar alerta
  async sendAlert(title: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    try {
      // Em produção, enviar para lista de administradores
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@nuvelon.com']
      
      const alertMessage = `[ALERTA ${severity.toUpperCase()}] ${message}`
      
      for (const email of adminEmails) {
        await this.sendEmailNotification({
          to: email,
          subject: `[ALERTA ${severity.toUpperCase()}] ${title} - Nuvelon`,
          body: alertMessage,
          html: this.generateAlertEmailHTML(title, message, severity)
        })

        this.addNotification({
          id: `alert_${severity}_${Date.now()}_${Math.random()}`,
          type: 'alert',
          title,
          message: alertMessage,
          recipient: email,
          recipientType: 'email',
          status: 'sent',
          createdAt: new Date(),
          sentAt: new Date(),
          metadata: { severity }
        })
      }

      console.log(`[NOTIFICATION] Alert notification sent to ${adminEmails.length} admins`)
      
    } catch (error) {
      console.error('[NOTIFICATION] Error sending alert notification:', error)
      throw error
    }
  }

  // Enviar email (simulado - em produção usar serviço real)
  private async sendEmailNotification(notification: EmailNotification): Promise<void> {
    // Simular envio de email
    console.log(`[EMAIL] To: ${notification.to}`)
    console.log(`[EMAIL] Subject: ${notification.subject}`)
    console.log(`[EMAIL] Body: ${notification.body}`)
    
    // Em produção, usar serviço como SendGrid, AWS SES, etc.
    // await emailService.send(notification)
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Enviar SMS (simulado - em produção usar serviço real)
  private async sendSMSNotification(notification: SMSNotification): Promise<void> {
    // Simular envio de SMS
    console.log(`[SMS] To: ${notification.to}`)
    console.log(`[SMS] Message: ${notification.message}`)
    
    // Em produção, usar serviço como Twilio, AWS SNS, etc.
    // await smsService.send(notification)
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Gerar corpo do email de renovação
  private generateRenewalEmailBody(clientName: string, planName: string, renewalDate: Date, daysUntilRenewal: number, actionRequired: string): string {
    return `
Olá ${clientName},

${actionRequired}

Detalhes do seu plano:
- Plano: ${planName}
- Data de renovação: ${renewalDate.toLocaleDateString('pt-BR')}
- Dias restantes: ${daysUntilRenewal > 0 ? daysUntilRenewal : 'VENCIDO'}

Para renovar seu plano, acesse nosso painel administrativo ou entre em contato conosco.

Atenciosamente,
Equipe Nuvelon
    `.trim()
  }

  // Gerar HTML do email de renovação
  private generateRenewalEmailHTML(clientName: string, planName: string, renewalDate: Date, daysUntilRenewal: number, actionRequired: string): string {
    const urgencyColor = daysUntilRenewal <= 0 ? '#dc2626' : daysUntilRenewal <= 3 ? '#ea580c' : '#2563eb'
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .alert { background: ${urgencyColor}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nuvelon Cloud Gaming</h1>
        </div>
        <div class="content">
            <h2>Olá ${clientName},</h2>
            <div class="alert">
                <strong>${actionRequired}</strong>
            </div>
            <div class="details">
                <h3>Detalhes do seu plano:</h3>
                <p><strong>Plano:</strong> ${planName}</p>
                <p><strong>Data de renovação:</strong> ${renewalDate.toLocaleDateString('pt-BR')}</p>
                <p><strong>Dias restantes:</strong> ${daysUntilRenewal > 0 ? daysUntilRenewal : 'VENCIDO'}</p>
            </div>
            <p>Para renovar seu plano, acesse nosso painel administrativo ou entre em contato conosco.</p>
        </div>
        <div class="footer">
            <p>Atenciosamente,<br>Equipe Nuvelon</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  // Gerar mensagem SMS de renovação
  private generateRenewalSMSMessage(clientName: string, planName: string, daysUntilRenewal: number, actionRequired: string): string {
    const urgency = daysUntilRenewal <= 0 ? 'URGENTE' : daysUntilRenewal <= 3 ? 'IMPORTANTE' : 'LEMBRETE'
    return `[${urgency}] Nuvelon: ${actionRequired} Plano: ${planName}. Renove em nuvelon.com`
  }

  // Gerar HTML do email de sistema
  private generateSystemEmailHTML(title: string, message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .message { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nuvelon - Notificação do Sistema</h1>
        </div>
        <div class="content">
            <h2>${title}</h2>
            <div class="message">
                <p>${message}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  // Gerar HTML do email de alerta
  private generateAlertEmailHTML(title: string, message: string, severity: string): string {
    const severityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#7c2d12'
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${severityColors[severity as keyof typeof severityColors]}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .alert { background: ${severityColors[severity as keyof typeof severityColors]}; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ALERTA ${severity.toUpperCase()} - Nuvelon</h1>
        </div>
        <div class="content">
            <h2>${title}</h2>
            <div class="alert">
                <p><strong>${message}</strong></p>
            </div>
            <p>Esta é uma notificação automática do sistema. Ação imediata pode ser necessária.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  // Adicionar notificação ao histórico
  private addNotification(notification: Notification): void {
    this.notifications.push(notification)
    
    // Limitar número de notificações em memória
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(-this.maxNotifications)
    }
  }

  // Obter histórico de notificações
  getNotificationHistory(limit: number = 100): Notification[] {
    return this.notifications.slice(-limit)
  }

  // Obter notificações por tipo
  getNotificationsByType(type: string): Notification[] {
    return this.notifications.filter(n => n.type === type)
  }

  // Obter notificações por destinatário
  getNotificationsByRecipient(recipient: string): Notification[] {
    return this.notifications.filter(n => n.recipient === recipient)
  }
}

// Instância singleton
export const notificationService = new NotificationService() 