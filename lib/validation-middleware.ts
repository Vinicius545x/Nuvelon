import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

export function withValidation(schema: ZodSchema) {
  return function (handler: Function) {
    return async (request: NextRequest) => {
      try {
        let body
        
        // Tentar pegar o body da request
        try {
          body = await request.json()
        } catch {
          // Se não conseguir fazer parse do JSON, usar um objeto vazio
          body = {}
        }

        // Validar com o schema
        const validatedData = schema.parse(body)
        
        // Adicionar dados validados à request
        ;(request as any).validatedData = validatedData
        
        return handler(request)
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Erro de validação
          const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
          
          return NextResponse.json({
            error: 'Dados inválidos',
            details: errors
          }, { status: 400 })
        }
        
        // Outro tipo de erro
        console.error('Erro de validação:', error)
        return NextResponse.json({
          error: 'Erro interno do servidor'
        }, { status: 500 })
      }
    }
  }
}

// Middleware para validação de query parameters
export function withQueryValidation(schema: ZodSchema) {
  return function (handler: Function) {
    return async (request: NextRequest) => {
      try {
        const url = new URL(request.url)
        const queryParams: Record<string, any> = {}
        
        // Converter query parameters para objeto
        url.searchParams.forEach((value, key) => {
          // Tentar converter para número se possível
          const numValue = Number(value)
          queryParams[key] = isNaN(numValue) ? value : numValue
        })
        
        // Validar com o schema
        const validatedData = schema.parse(queryParams)
        
        // Adicionar dados validados à request
        ;(request as any).validatedQuery = validatedData
        
        return handler(request)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
          
          return NextResponse.json({
            error: 'Parâmetros de consulta inválidos',
            details: errors
          }, { status: 400 })
        }
        
        console.error('Erro de validação de query:', error)
        return NextResponse.json({
          error: 'Erro interno do servidor'
        }, { status: 500 })
      }
    }
  }
}

// Helper para extrair dados validados
export function getValidatedData(request: NextRequest) {
  return (request as any).validatedData
}

export function getValidatedQuery(request: NextRequest) {
  return (request as any).validatedQuery
} 