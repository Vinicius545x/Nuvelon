import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/database'
import User from '@/models/User'
import { withValidation, getValidatedData } from '@/lib/validation-middleware'
import { loginSchema } from '@/lib/validations/auth'
import { loginRateLimiter } from '@/lib/rate-limiter'
import { securityLogger } from '@/lib/security-logger'

const loginHandler = async (request: NextRequest) => {
  try {
    await dbConnect()
    
    const { username, password } = getValidatedData(request)

    // Buscar usuário no banco
    const user = await User.findOne({ username, isActive: true })
    if (!user) {
      securityLogger.logLoginAttempt(request, username, false, 'User not found')
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      securityLogger.logLoginAttempt(request, username, false, 'Invalid password')
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Log de login bem-sucedido
    securityLogger.logLoginAttempt(request, username, true)

    // Atualizar último login
    user.lastLogin = new Date()
    await user.save()

    // Gerar JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        username: user.username, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '1h' }
    )

    // Gerar refresh token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'
    const refreshToken = jwt.sign(
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
      message: 'Login realizado com sucesso',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      },
      token,
      refreshToken
    })

    // Configurar cookies seguros
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 hora
    })

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    })

    return response

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const POST = loginRateLimiter(withValidation(loginSchema)(loginHandler)) 