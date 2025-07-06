import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IClientHistory extends Document {
  client: Types.ObjectId | IClient
  action: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  user: Types.ObjectId | IUser
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const clientHistorySchema = new Schema<IClientHistory>({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Cliente é obrigatório']
  },
  action: {
    type: String,
    required: [true, 'Ação é obrigatória'],
    enum: [
      'created',
      'updated',
      'deleted',
      'status_changed',
      'plan_changed',
      'renewal_date_changed',
      'payment_received',
      'payment_failed',
      'suspended',
      'reactivated'
    ]
  },
  oldValues: {
    type: Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: Schema.Types.Mixed,
    default: {}
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Índices para performance
clientHistorySchema.index({ client: 1 })
clientHistorySchema.index({ user: 1 })
clientHistorySchema.index({ action: 1 })
clientHistorySchema.index({ createdAt: -1 })
clientHistorySchema.index({ client: 1, createdAt: -1 })

// Índice TTL para limpeza automática de logs antigos (opcional)
// clientHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }) // 90 dias

export default mongoose.models.ClientHistory || mongoose.model<IClientHistory>('ClientHistory', clientHistorySchema) 