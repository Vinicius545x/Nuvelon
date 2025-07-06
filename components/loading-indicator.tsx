"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface LoadingIndicatorProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'card' | 'inline'
}

export function LoadingIndicator({ 
  message = "Carregando...", 
  size = 'md',
  variant = 'default' 
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const spinner = (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
  )

  if (variant === 'card') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          {spinner}
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        {spinner}
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {spinner}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// Componente para carregamento de página completa
export function PageLoading({ message = "Carregando página..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingIndicator message={message} size="lg" />
    </div>
  )
}

// Componente para carregamento de seção
export function SectionLoading({ message = "Carregando seção..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingIndicator message={message} size="md" />
    </div>
  )
}

// Componente para carregamento de tabela
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  )
}

// Componente para carregamento de cards
export function CardsLoading({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 