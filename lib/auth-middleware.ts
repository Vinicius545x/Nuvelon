import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { securityLogger } from './security-logger'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    username: string
    role: string
  }
}

export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: AuthenticatedRequest) => {
    try {
      // Verificar token no header Authorization
      const authHeader = request.headers.get('authorization')
      let token: string | null = null

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      } else {
        // Verificar token no cookie
        token = request.cookies.get('auth-token')?.value || null
      }

      if (!token) {
        securityLogger.logAccessDenied(request, 'No token provided')
        return NextResponse.json(
          { error: 'Token de autenticação não fornecido' },
          { status: 401 }
        )
      }

      // Verificar JWT
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
      
      try {
        const decoded = jwt.verify(token, jwtSecret) as any
        
        // Verificar se o token não expirou
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          securityLogger.logAccessDenied(request, 'Token expired', decoded.userId)
          return NextResponse.json(
            { error: 'Token expirado' },
            { status: 401 }
          )
        }

        // Adicionar informações do usuário à request
        request.user = {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role
        }

        return handler(request)
      } catch (jwtError) {
        securityLogger.logAccessDenied(request, 'Invalid token')
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}

// Middleware para verificar roles específicas
export function withRole(requiredRole: string) {
  return function (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (request: AuthenticatedRequest) => {
      if (!request.user) {
        return NextResponse.json(
          { error: 'Usuário não autenticado' },
          { status: 401 }
        )
      }

      if (request.user.role !== requiredRole && request.user.role !== 'admin') {
        securityLogger.logAccessDenied(
          request, 
          `Insufficient permissions. Required: ${requiredRole}, User: ${request.user.role}`,
          request.user.userId
        )
        return NextResponse.json(
          { error: 'Permissão insuficiente' },
          { status: 403 }
        )
      }

      return handler(request)
    })
  }
}

// Middleware para verificar múltiplas roles
export function withAnyRole(requiredRoles: string[]) {
  return function (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (request: AuthenticatedRequest) => {
      if (!request.user) {
        return NextResponse.json(
          { error: 'Usuário não autenticado' },
          { status: 401 }
        )
      }

      const hasPermission = requiredRoles.includes(request.user.role) || request.user.role === 'admin'
      
      if (!hasPermission) {
        securityLogger.logAccessDenied(
          request, 
          `Insufficient permissions. Required: ${requiredRoles.join(', ')}, User: ${request.user.role}`,
          request.user.userId
        )
        return NextResponse.json(
          { error: 'Permissão insuficiente' },
          { status: 403 }
        )
      }

      return handler(request)
    })
  }
}

// Helper para obter usuário autenticado
export function getAuthenticatedUser(request: AuthenticatedRequest) {
  return request.user
}

// Função para verificar se o usuário tem permissão
export function hasPermission(userRole: string, requiredRole: string): boolean {
  return userRole === requiredRole || userRole === 'admin'
}

// Função para verificar se o usuário tem qualquer uma das permissões
export function hasAnyPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole) || userRole === 'admin'
} 