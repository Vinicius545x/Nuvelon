import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  username: string
  role: string
  iat: number
  exp: number
}

export function verifyAuth(request: NextRequest): { isValid: boolean; user?: JWTPayload; error?: string } {
  try {
    // Pegar token do cookie ou header Authorization
    const authToken = request.cookies.get('auth-token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return { isValid: false, error: 'Token não fornecido' }
    }

    // Verificar e decodificar o token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
    const decoded = jwt.verify(authToken, jwtSecret) as JWTPayload

    return { isValid: true, user: decoded }

  } catch (error) {
    return { isValid: false, error: 'Token inválido ou expirado' }
  }
}

export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const authResult = verifyAuth(request)
    
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: 401 }
      )
    }

    // Adicionar dados do usuário ao request para uso posterior
    ;(request as any).user = authResult.user

    return handler(request)
  }
} 