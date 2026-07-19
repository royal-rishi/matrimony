// ============================================================
// TYPED EMAIL PROVIDER ERRORS
// ============================================================

export class Msg91EmailError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly providerResponse?: any
  ) {
    super(message)
    this.name = 'Msg91EmailError'
    
    // Maintain proper stack trace (only in V8/NodeJS environments)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Msg91EmailError)
    }
  }
}
