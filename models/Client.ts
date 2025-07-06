import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IClient extends Document {
  name: string
  email?: string
  phone?: string
  plan: Types.ObjectId | IPlan
  purchaseDate: Date
  renewalDate: Date
  status: 'Ativo' | 'Precisa Renovar' | 'Cancelado' | 'Suspenso'
  notes?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  paymentInfo?: {
    method?: string
    lastPayment?: Date
    nextPayment?: Date
  }
  createdAt: Date
  updatedAt: Date
}

const clientSchema = new Schema<IClient>({
  name: {
    type: String,
    required: [true, 'Nome do cliente é obrigatório'],
    trim: true,
    maxlength: [255, 'Nome não pode ter mais de 255 caracteres']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Telefone inválido']
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Plano é obrigatório']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Data de compra é obrigatória'],
    default: Date.now
  },
  renewalDate: {
    type: Date,
    required: [true, 'Data de renovação é obrigatória']
  },
  status: {
    type: String,
    enum: ['Ativo', 'Precisa Renovar', 'Cancelado', 'Suspenso'],
    default: 'Ativo'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [255, 'Rua não pode ter mais de 255 caracteres']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'Cidade não pode ter mais de 100 caracteres']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'Estado não pode ter mais de 50 caracteres']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'CEP não pode ter mais de 20 caracteres']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'País não pode ter mais de 100 caracteres']
    }
  },
  paymentInfo: {
    method: {
      type: String,
      trim: true,
      maxlength: [50, 'Método de pagamento não pode ter mais de 50 caracteres']
    },
    lastPayment: {
      type: Date
    },
    nextPayment: {
      type: Date
    }
  }
}, {
  timestamps: true
})

// Índices para performance
clientSchema.index({ name: 1 })
clientSchema.index({ email: 1 })
clientSchema.index({ status: 1 })
clientSchema.index({ plan: 1 })
clientSchema.index({ purchaseDate: 1 })
clientSchema.index({ renewalDate: 1 })
clientSchema.index({ 'address.city': 1 })
clientSchema.index({ 'address.state': 1 })

// Índice composto para busca eficiente
clientSchema.index({ name: 'text', email: 'text', notes: 'text' })

// Middleware para calcular data de renovação automaticamente
clientSchema.pre('save', async function(next) {
  if (this.isModified('purchaseDate') || this.isModified('plan')) {
    try {
      const Plan = mongoose.model('Plan')
      const plan = await Plan.findById(this.plan)
      
      if (plan) {
        const renewalDate = new Date(this.purchaseDate)
        renewalDate.setMonth(renewalDate.getMonth() + plan.durationMonths)
        this.renewalDate = renewalDate
      }
    } catch (error) {
      next(error as Error)
    }
  }
  next()
})

// Método para atualizar status baseado na data de renovação
clientSchema.methods.updateStatus = function() {
  const today = new Date()
  const renewalDate = new Date(this.renewalDate)
  
  if (this.status === 'Cancelado' || this.status === 'Suspenso') {
    return this.status
  }
  
  if (renewalDate < today) {
    this.status = 'Precisa Renovar'
  } else if (this.status === 'Precisa Renovar' && renewalDate > today) {
    this.status = 'Ativo'
  }
  
  return this.status
}

// Método virtual para calcular dias até renovação
clientSchema.virtual('daysUntilRenewal').get(function() {
  const today = new Date()
  const renewalDate = new Date(this.renewalDate)
  const diffTime = renewalDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Configurar para incluir virtuals no JSON
clientSchema.set('toJSON', { virtuals: true })

export default mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema) 