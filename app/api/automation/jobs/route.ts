import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { getScheduledJobsStatus, runScheduledJob, toggleScheduledJob } from '@/lib/automation/scheduled-jobs'

// GET - Obter status de todos os jobs
const getJobsHandler = async (request: AuthenticatedRequest) => {
  try {
    const jobs = getScheduledJobsStatus()
    
    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        schedule: job.schedule,
        enabled: job.enabled,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        errorCount: job.errorCount,
        maxErrors: job.maxErrors
      }))
    })
  } catch (error) {
    console.error('Error getting jobs status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Executar job manualmente
const runJobHandler = async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'ID do job é obrigatório' },
        { status: 400 }
      )
    }

    await runScheduledJob(jobId)
    
    return NextResponse.json({
      success: true,
      message: `Job ${jobId} executado com sucesso`
    })
  } catch (error) {
    console.error('Error running job:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Habilitar/desabilitar job
const toggleJobHandler = async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { jobId, enabled } = body

    if (!jobId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'ID do job e status enabled são obrigatórios' },
        { status: 400 }
      )
    }

    toggleScheduledJob(jobId, enabled)
    
    return NextResponse.json({
      success: true,
      message: `Job ${jobId} ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`
    })
  } catch (error) {
    console.error('Error toggling job:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getJobsHandler)
export const POST = withAuth(runJobHandler)
export const PUT = withAuth(toggleJobHandler) 