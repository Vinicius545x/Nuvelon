import { z } from 'zod'

// Schema para endereço
const addressSchema = z.object({
  street: z.string().max(255, 'Rua não pode ter mais de 255 caracteres').optional(),
  city: z.string().max(100, 'Cidade não pode ter mais de 100 caracteres').optional(),
  state: z.string().max(50, 'Estado não pode ter mais de 50 caracteres').optional(),
  zipCode: z.string().max(20, 'CEP não pode ter mais de 20 caracteres').optional(),
  country: z.string().max(100, 'País não pode ter mais de 100 caracteres').optional()
})

// Schema para informações de pagamento
const paymentInfoSchema = z.object({
  method: z.string().max(50, 'Método de pagamento não pode ter mais de 50 caracteres').optional(),
  lastPayment: z.date().optional(),
  nextPayment: z.date().optional()
})

// Schema para criação de cliente
export const createClientSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome não pode ter mais de 255 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  plan: z
    .string()
    .min(1, 'Plano é obrigatório'),
  purchaseDate: z
    .date({
      required_error: 'Data de compra é obrigatória',
      invalid_type_error: 'Data de compra deve ser uma data válida'
    }),
  status: z
    .enum(['Ativo', 'Precisa Renovar', 'Cancelado', 'Suspenso'])
    .default('Ativo'),
  notes: z
    .string()
    .max(1000, 'Observações não podem ter mais de 1000 caracteres')
    .optional()
    .or(z.literal('')),
  address: addressSchema.optional(),
  paymentInfo: paymentInfoSchema.optional()
})

// Schema para atualização de cliente
export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().min(1, 'ID do cliente é obrigatório')
})

// Schema para busca de clientes
export const searchClientSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['Ativo', 'Precisa Renovar', 'Cancelado', 'Suspenso', 'all']).optional(),
  plan: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'purchaseDate', 'renewalDate', 'status']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// Schema para filtros de cliente
export const clientFiltersSchema = z.object({
  status: z.enum(['Ativo', 'Precisa Renovar', 'Cancelado', 'Suspenso']).optional(),
  planType: z.enum(['Mensal', 'Trimestral', 'Anual']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  renewalDateFrom: z.date().optional(),
  renewalDateTo: z.date().optional()
})

// Tipos TypeScript derivados dos schemas
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type SearchClientInput = z.infer<typeof searchClientSchema>
export type ClientFiltersInput = z.infer<typeof clientFiltersSchema> 