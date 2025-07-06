import { IUser } from '@/models/User'
import { IPlan } from '@/models/Plan'
import { IClient } from '@/models/Client'
import { IClientHistory } from '@/models/ClientHistory'

declare global {
  namespace NodeJS {
    interface Global {
      mongoose: {
        conn: any
        promise: any
      }
    }
  }
}

export type { IUser, IPlan, IClient, IClientHistory } 