import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Janela de tempo em milissegundos
  maxRequests: number // Máximo de requisições por janela
  message?: string // Mensagem de erro
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// Store em memória (em produção, usar Redis)
const store: RateLimitStore = {}

export function createRateLimiter(config: RateLimitConfig) {
  return function (handler: Function) {
    return async (request: NextRequest) => {
      const ip = getClientIP(request)
      const key = `rate_limit:${ip}`
      const now = Date.now()
      
      // Limpar entradas expiradas
      if (store[key] && now > store[key].resetTime) {
        delete store[key]
      }
      
      // Inicializar ou incrementar contador
      if (!store[key]) {
        store[key] = {
          count: 1,
          resetTime: now + config.windowMs
        }
      } else {
        store[key].count++
      }
      
      // Verificar se excedeu o limite
      if (store[key].count > config.maxRequests) {
        return NextResponse.json({
          error: config.message || 'Muitas tentativas. Tente novamente mais tarde.',
          retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
        }, { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((store[key].resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store[key].resetTime.toString()
          }
        })
      }
      
      // Adicionar headers de rate limit
      const response = await handler(request)
      
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', (config.maxRequests - store[key].count).toString())
        response.headers.set('X-RateLimit-Reset', store[key].resetTime.toString())
      }
      
      return response
    }
  }
}

// Rate limiter específico para login
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 tentativas por 15 minutos
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
})

// Rate limiter para requisições gerais
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requisições por minuto
  message: 'Muitas requisições. Tente novamente mais tarde.'
})

// Função para obter IP do cliente
function getClientIP(request: NextRequest): string {
  // Tentar pegar IP de headers comuns
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback para IP local
  return '127.0.0.1'
}

// Função para limpar rate limit de um IP específico (útil para testes)
export function clearRateLimit(ip: string) {
  const key = `rate_limit:${ip}`
  delete store[key]
}

// Função para obter estatísticas de rate limit
export function getRateLimitStats(ip: string) {
  const key = `rate_limit:${ip}`
  return store[key] || null
} 