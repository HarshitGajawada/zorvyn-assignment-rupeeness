declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: 'viewer' | 'analyst' | 'admin'
      }
    }
  }
}

export {}
