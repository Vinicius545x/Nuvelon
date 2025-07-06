declare module 'jsonwebtoken' {
  export function sign(payload: any, secretOrPrivateKey: string, options?: any): string
  export function verify(token: string, secretOrPublicKey: string): any
  export function decode(token: string): any
} 