import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/database'
import User from '@/models/User'

interface RefreshTokenPayload {
  userId: string
  type: string
  iat: number
  exp: number
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    // Pegar refresh token do cookie ou body
    const refreshToken = request.cookies.get('refresh-token')?.value || 
                        (await request.json()).refreshToken

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token não fornecido' },
        { status: 400 }
      )
    }

    // Verificar refresh token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'
    
    try {
      const decoded = jwt.verify(refreshToken, refreshSecret) as RefreshTokenPayload
      
      // Verificar se é um refresh token válido
      if (decoded.type !== 'refresh') {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }

      // Buscar dados do usuário no banco
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      // Gerar novo access token
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
      const newToken = jwt.sign(
        { 
          userId: user._id.toString(), 
          username: user.username, 
          role: user.role 
        },
        jwtSecret,
        { expiresIn: '1h' }
      )

      // Gerar novo refresh token
      const newRefreshToken = jwt.sign(
        { 
          userId: user._id.toString(), 
          type: 'refresh' 
        },
        refreshSecret,
        { expiresIn: '7d' }
      )

      // Retornar resposta
      const response = NextResponse.json({
        success: true,
        message: 'Token renovado com sucesso',
        token: newToken,
        refreshToken: newRefreshToken
      })

      // Atualizar cookies
      response.cookies.set('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 // 1 hora
      })

      response.cookies.set('refresh-token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 dias
      })

      return response

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Refresh token inválido ou expirado' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Erro ao renovar token:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 