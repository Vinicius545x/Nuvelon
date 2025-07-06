"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Save, CheckCircle, AlertCircle, X } from "lucide-react"

interface PersistenceNotificationProps {
  type: 'auto-save' | 'draft-saved' | 'data-loaded' | 'error'
  message: string
  onDismiss?: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

export function PersistenceNotification({
  type,
  message,
  onDismiss,
  autoHide = true,
  autoHideDelay = 3000
}: PersistenceNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const getIcon = () => {
    switch (type) {
      case 'auto-save':
        return <Save className="h-4 w-4 text-blue-600" />
      case 'draft-saved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'data-loaded':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Save className="h-4 w-4 text-blue-600" />
    }
  }

  const getBadgeVariant = () => {
    switch (type) {
      case 'auto-save':
        return 'secondary'
      case 'draft-saved':
        return 'default'
      case 'data-loaded':
        return 'default'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (!isVisible) return null

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-l-4 border-l-blue-500 z-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getIcon()}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {type === 'auto-save' && 'Auto-save'}
                  {type === 'draft-saved' && 'Rascunho'}
                  {type === 'data-loaded' && 'Carregado'}
                  {type === 'error' && 'Erro'}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook para gerenciar notificações de persistência
export function usePersistenceNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'auto-save' | 'draft-saved' | 'data-loaded' | 'error'
    message: string
    timestamp: number
  }>>([])

  const addNotification = (type: 'auto-save' | 'draft-saved' | 'data-loaded' | 'error', message: string) => {
    const id = Date.now().toString()
    const notification = {
      id,
      type,
      message,
      timestamp: Date.now()
    }

    setNotifications(prev => [...prev, notification])

    // Remover notificação após 5 segundos
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  }
}

// Componente para mostrar múltiplas notificações
export function PersistenceNotifications() {
  const { notifications, removeNotification } = usePersistenceNotifications()

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <PersistenceNotification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onDismiss={() => removeNotification(notification.id)}
          autoHide={true}
          autoHideDelay={5000}
        />
      ))}
    </div>
  )
} 