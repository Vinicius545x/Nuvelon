'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Play, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface Job {
  id: string
  name: string
  schedule: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  errorCount: number
  maxErrors: number
}

export function JobsMonitor() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [runningJob, setRunningJob] = useState<string | null>(null)

  // Carregar jobs
  const loadJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/automation/jobs')
      const data = await response.json()
      
      if (response.ok) {
        setJobs(data.jobs)
      } else {
        setError(data.error || 'Erro ao carregar jobs')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  // Executar job manualmente
  const runJob = async (jobId: string) => {
    try {
      setRunningJob(jobId)
      const response = await fetch('/api/automation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Recarregar jobs para atualizar status
        await loadJobs()
      } else {
        setError(data.error || 'Erro ao executar job')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setRunningJob(null)
    }
  }

  // Habilitar/desabilitar job
  const toggleJob = async (jobId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/automation/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, enabled })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Atualizar estado local
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, enabled } : job
        ))
      } else {
        setError(data.error || 'Erro ao alterar status do job')
      }
    } catch (error) {
      setError('Erro de conexão')
    }
  }

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  // Formatar cron expression
  const formatCron = (cron: string) => {
    const parts = cron.split(' ')
    if (parts.length !== 5) return cron
    
    const [minute, hour, day, month, weekday] = parts
    
    if (weekday !== '*') {
      const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      return `Aos ${weekdays[parseInt(weekday) - 1]}s às ${hour}:${minute}`
    }
    
    if (day !== '*') {
      return `Dia ${day} de cada mês às ${hour}:${minute}`
    }
    
    if (hour !== '*') {
      return `Diariamente às ${hour}:${minute}`
    }
    
    if (minute !== '*') {
      return `A cada ${minute} minutos`
    }
    
    return cron
  }

  // Obter status do job
  const getJobStatus = (job: Job) => {
    if (job.errorCount >= job.maxErrors) {
      return { status: 'error', icon: XCircle, text: 'Erro Crítico', color: 'text-red-500' }
    }
    if (job.errorCount > 0) {
      return { status: 'warning', icon: AlertTriangle, text: 'Com Erros', color: 'text-yellow-500' }
    }
    if (job.enabled) {
      return { status: 'success', icon: CheckCircle, text: 'Ativo', color: 'text-green-500' }
    }
    return { status: 'disabled', icon: XCircle, text: 'Desabilitado', color: 'text-gray-500' }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando jobs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Jobs</h2>
          <p className="text-gray-600">Gerencie os jobs automatizados do sistema</p>
        </div>
        <Button onClick={loadJobs} variant="outline">
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const status = getJobStatus(job)
          const StatusIcon = status.icon
          
          return (
            <Card key={job.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{job.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {formatCron(job.schedule)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                    <Badge variant={status.status === 'error' ? 'destructive' : 'secondary'}>
                      {status.text}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última execução:</span>
                    <span>{formatDate(job.lastRun)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Próxima execução:</span>
                    <span>{formatDate(job.nextRun)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Erros:</span>
                    <span className={job.errorCount > 0 ? 'text-red-500' : 'text-green-500'}>
                      {job.errorCount}/{job.maxErrors}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={job.enabled}
                      onCheckedChange={(enabled) => toggleJob(job.id, enabled)}
                      disabled={job.errorCount >= job.maxErrors}
                    />
                    <span className="text-sm text-gray-600">
                      {job.enabled ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => runJob(job.id)}
                    disabled={runningJob === job.id || !job.enabled}
                  >
                    {runningJob === job.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {jobs.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum job encontrado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 