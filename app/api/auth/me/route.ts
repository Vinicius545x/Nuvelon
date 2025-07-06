import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import dbConnect from '@/lib/database'
import User from '@/models/User'

const meHandler = async (request: AuthenticatedRequest) => {
  try {
    await dbConnect()
    
    // Buscar dados do usuário no banco
    const user = await User.findById(request.user!.userId).select('-password')
    
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

  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(meHandler) 