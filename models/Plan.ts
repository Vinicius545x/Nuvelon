import mongoose, { Document, Schema } from 'mongoose'

export interface IPlan extends Document {
  name: string
  description?: string
  durationMonths: number
  price: number
  features: string[]
  isActive: boolean
  maxClients?: number
  createdAt: Date
  updatedAt: Date
}

const planSchema = new Schema<IPlan>({
  name: {
    type: String,
    required: [true, 'Nome do plano é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  durationMonths: {
    type: Number,
    required: [true, 'Duração em meses é obrigatória'],
    min: [1, 'Duração deve ser pelo menos 1 mês'],
    max: [60, 'Duração não pode ser mais de 60 meses']
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço não pode ser negativo']
  },
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxClients: {
    type: Number,
    min: [1, 'Máximo de clientes deve ser pelo menos 1']
  }
}, {
  timestamps: true
})

// Índices para performance
planSchema.index({ name: 1 })
planSchema.index({ isActive: 1 })
planSchema.index({ durationMonths: 1 })
planSchema.index({ price: 1 })

// Método virtual para calcular preço por mês
planSchema.virtual('pricePerMonth').get(function() {
  return this.price / this.durationMonths
})

// Configurar para incluir virtuals no JSON
planSchema.set('toJSON', { virtuals: true })

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', planSchema) 