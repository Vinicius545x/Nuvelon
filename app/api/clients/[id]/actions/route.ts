import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { withValidation, getValidatedData } from '@/lib/validation-middleware'
import { z } from 'zod'
import { clientBusinessLogic } from '@/lib/business/client-business-logic'

// Schema para renovação
const renewSchema = z.object({
  planId: z.string().min(1, 'ID do plano é obrigatório')
})

// Schema para cancelamento/suspensão
const actionSchema = z.object({
  reason: z.string().min(1, 'Motivo é obrigatório').max(500, 'Motivo não pode ter mais de 500 caracteres')
})

// POST - Renovar cliente
const renewClientHandler = async (request: AuthenticatedRequest) => {
  try {
    const clientId = request.nextUrl.pathname.split('/')[3] // Extrair ID da URL
    const { planId } = getValidatedData(request)
    const user = request.user!

    const client = await clientBusinessLogic.renewClient(clientId, planId, user.userId)
    
    return NextResponse.json({
      success: true,
      message: 'Cliente renovado com sucesso',
      client: {
        id: client._id.toString(),
        name: client.name,
        status: client.status,
        renewalDate: client.renewalDate
      }
    })
  } catch (error) {
    console.error('Error renewing client:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Cancelar cliente
const cancelClientHandler = async (request: AuthenticatedRequest) => {
  try {
    const clientId = request.nextUrl.pathname.split('/')[3]
    const { reason } = getValidatedData(request)
    const user = request.user!

    const client = await clientBusinessLogic.cancelClient(clientId, reason, user.userId)
    
    return NextResponse.json({
      success: true,
      message: 'Cliente cancelado com sucesso',
      client: {
        id: client._id.toString(),
        name: client.name,
        status: client.status
      }
    })
  } catch (error) {
    console.error('Error cancelling client:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Suspender cliente
const suspendClientHandler = async (request: AuthenticatedRequest) => {
  try {
    const clientId = request.nextUrl.pathname.split('/')[3]
    const { reason } = getValidatedData(request)
    const user = request.user!

    const client = await clientBusinessLogic.suspendClient(clientId, reason, user.userId)
    
    return NextResponse.json({
      success: true,
      message: 'Cliente suspenso com sucesso',
      client: {
        id: client._id.toString(),
        name: client.name,
        status: client.status
      }
    })
  } catch (error) {
    console.error('Error suspending client:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Reativar cliente
const reactivateClientHandler = async (request: AuthenticatedRequest) => {
  try {
    const clientId = request.nextUrl.pathname.split('/')[3]
    const user = request.user!

    const client = await clientBusinessLogic.reactivateClient(clientId, user.userId)
    
    return NextResponse.json({
      success: true,
      message: 'Cliente reativado com sucesso',
      client: {
        id: client._id.toString(),
        name: client.name,
        status: client.status
      }
    })
  } catch (error) {
    console.error('Error reactivating client:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Rota principal que direciona para a ação específica
const actionsHandler = async (request: AuthenticatedRequest) => {
  const action = request.nextUrl.searchParams.get('action')
  
  switch (action) {
    case 'renew':
      return withValidation(renewSchema)(renewClientHandler)(request)
    case 'cancel':
      return withValidation(actionSchema)(cancelClientHandler)(request)
    case 'suspend':
      return withValidation(actionSchema)(suspendClientHandler)(request)
    case 'reactivate':
      return reactivateClientHandler(request)
    default:
      return NextResponse.json(
        { error: 'Ação inválida. Use: renew, cancel, suspend, reactivate' },
        { status: 400 }
      )
  }
}

export const POST = withAuth(actionsHandler) 