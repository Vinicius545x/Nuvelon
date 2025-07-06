import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { clientBusinessLogic } from '@/lib/business/client-business-logic'

// GET - Obter estatísticas de clientes
const getStatisticsHandler = async (request: AuthenticatedRequest) => {
  try {
    const stats = await clientBusinessLogic.getClientStatistics()
    
    return NextResponse.json({
      success: true,
      statistics: {
        totalClients: stats.totalClients,
        activeClients: stats.activeClients,
        needsRenewal: stats.needsRenewal,
        cancelledClients: stats.cancelledClients,
        suspendedClients: stats.suspendedClients,
        expiringSoon: stats.expiringSoon,
        monthlyRevenue: stats.monthlyRevenue
      }
    })
  } catch (error) {
    console.error('Error getting client statistics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getStatisticsHandler) 