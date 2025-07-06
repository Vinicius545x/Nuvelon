import cron from 'node-cron'
import { securityLogger } from '../security-logger'

export interface Job {
  id: string
  name: string
  schedule: string
  handler: () => Promise<void>
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  errorCount: number
  maxErrors: number
}

class JobScheduler {
  private jobs: Map<string, Job> = new Map()
  private running: boolean = false

  // Adicionar um novo job
  addJob(job: Job): void {
    if (this.jobs.has(job.id)) {
      throw new Error(`Job with id ${job.id} already exists`)
    }

    this.jobs.set(job.id, job)
    
    if (job.enabled) {
      this.scheduleJob(job)
    }

    console.log(`[JOB SCHEDULER] Job ${job.name} (${job.id}) added`)
  }

  // Agendar um job
  private scheduleJob(job: Job): void {
    try {
      cron.schedule(job.schedule, async () => {
        await this.executeJob(job)
      }, {
        scheduled: true,
        timezone: 'America/Sao_Paulo'
      })

      // Calcular próxima execução
      const nextRun = this.calculateNextRun(job.schedule)
      job.nextRun = nextRun

      console.log(`[JOB SCHEDULER] Job ${job.name} scheduled for ${nextRun}`)
    } catch (error) {
      console.error(`[JOB SCHEDULER] Error scheduling job ${job.name}:`, error)
      job.enabled = false
    }
  }

  // Executar um job
  private async executeJob(job: Job): Promise<void> {
    if (!job.enabled) return

    console.log(`[JOB SCHEDULER] Starting job ${job.name}`)
    
    try {
      job.lastRun = new Date()
      await job.handler()
      
      // Reset error count on success
      job.errorCount = 0
      
      // Calculate next run
      job.nextRun = this.calculateNextRun(job.schedule)
      
      console.log(`[JOB SCHEDULER] Job ${job.name} completed successfully`)
    } catch (error) {
      job.errorCount++
      console.error(`[JOB SCHEDULER] Job ${job.name} failed:`, error)
      
      // Log error for security monitoring
      securityLogger.log({
        event: 'JOB_FAILED',
        ip: 'system',
        details: {
          jobId: job.id,
          jobName: job.name,
          error: error instanceof Error ? error.message : String(error),
          errorCount: job.errorCount
        },
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })

      // Disable job if max errors reached
      if (job.errorCount >= job.maxErrors) {
        job.enabled = false
        console.error(`[JOB SCHEDULER] Job ${job.name} disabled due to max errors`)
      }
    }
  }

  // Executar job manualmente
  async runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    await this.executeJob(job)
  }

  // Habilitar/desabilitar job
  toggleJob(jobId: string, enabled: boolean): void {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    job.enabled = enabled
    
    if (enabled) {
      this.scheduleJob(job)
    }

    console.log(`[JOB SCHEDULER] Job ${job.name} ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Obter status de todos os jobs
  getJobsStatus(): Job[] {
    return Array.from(this.jobs.values())
  }

  // Obter job específico
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId)
  }

  // Remover job
  removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (!job) return false

    this.jobs.delete(jobId)
    console.log(`[JOB SCHEDULER] Job ${job.name} removed`)
    return true
  }

  // Calcular próxima execução
  private calculateNextRun(schedule: string): Date {
    const now = new Date()
    const nextRun = cron.getNextDateFromExpression(schedule, now)
    return nextRun
  }

  // Iniciar o scheduler
  start(): void {
    if (this.running) return

    this.running = true
    console.log('[JOB SCHEDULER] Started')
  }

  // Parar o scheduler
  stop(): void {
    if (!this.running) return

    this.running = false
    console.log('[JOB SCHEDULER] Stopped')
  }

  // Verificar se está rodando
  isRunning(): boolean {
    return this.running
  }
}

// Instância singleton
export const jobScheduler = new JobScheduler()

// Iniciar o scheduler quando o módulo for carregado
jobScheduler.start() 