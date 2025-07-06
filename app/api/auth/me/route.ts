import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/database'
import User from '@/models/User'

interface JWTPayload {
  userId: string
  username: string
  role: string
  iat: number
  exp: number
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // Pegar token do cookie ou header Authorization
    const authToken = request.cookies.get('auth-token')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    // Verificar e decodificar o token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
    
    try {
      const decoded = jwt.verify(authToken, jwtSecret) as JWTPayload
      
      // Buscar dados do usuário no banco
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      // Retornar dados do usuário (sem informações sensíveis)
      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 